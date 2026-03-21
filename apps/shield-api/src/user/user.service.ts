import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DATALAKE_CATALOG_NAME, UserID, userIdSchema } from "@port/common-schemas";
import { OpaApi } from "@port/opa-requests";
import {
  ClientBatchCheckItem,
  ClientBatchCheckSingleResponse,
  FGADomainRelationConstants,
  PLATFORM_FGA_INSTANCE,
  formatFGAObjectId,
  parseFGAObjectId,
} from "@port/openfga-client";
import {
  Table as MongooseTable,
  User as MongooseUser,
  UserDomain as MongooseUserDomain,
  OP,
  PermissionGroup,
  PermissionTable,
  PermissionTableDocument,
  Resource,
  SapPermittedUsers,
} from "@port/shield-models";
import {
  GetDictUserPreviewSchemaDto,
  USERS_PER_PAGE,
  UniquePopulationOption,
  AuthorizationSource,
  specialProperties,
} from "@port/shield-schemas";
import { calcSymetricDiff, getUserAttributesDiff } from "@port/shield-utils";
import { StandardTable, formatDate, formatRawStandardTable, getObjectEntries, stringify } from "@port/utils";
import { cloneDeep } from "lodash";
import { AnyBulkWriteOperation, BulkWriteResult, Collection, Db, ObjectId, UpdateOneModel, UpdateResult, WithId } from "mongodb";
import { HydratedDocument, Model, PipelineStage } from "mongoose";
import AuditingService from "src/auditing/auditing.service";
import { AUDITING_UNKNOWN, InsertUserAudit } from "src/auditing/auditing.types";
import { LoggedUser } from "src/auth/auth.interface";
import { ExcelService } from "src/excel/excel.service";
import { OPA_PROVIDE } from "src/opa/opa.provider";
import { OpenFgaService } from "src/openfga/openfga.service";
import { PermissionGroupsService } from "src/permission_groups/permission_groups.service";
import { RowFilter } from "src/permission_tables/permission_tables.classes";
import { PermissionTablesService } from "src/permission_tables/permission_tables.service";
import { IORedis } from "src/redis/ioredis";
import { REDIS_KEYS } from "src/redis/ioredis.keys";
import { SecretService } from "src/secret/secret.service";
import { dbTypeMapping } from "src/tables/table.constants";
import { TableService } from "src/tables/table.service";
import { TrinoService } from "src/trino/trino.service";
import { GetUserInfoDto } from "src/user-info/user-info.interface";
import { UserInfoService } from "src/user-info/user-info.service";
import { toFullName } from "src/user-info/user-info.utils";
import { BOOLEAN_TYPE, DB_CONNECTION_PROVIDER, EMPTY_WHERE_CLAUSE } from "src/utils/constants";
import { isMongoDuplicateKeyError } from "src/utils/mongo.utils";
import { customDiff } from "src/utils/utils";
import { PermissionGroupDiff } from "../permission_groups/permission_groups.interface";
import {
  User,
  UserAttributes,
  UserDomain,
  UserPermissionGroup,
  UserPermissionTable,
  UserRowFilter,
  UserRowFilterValue,
  ZFilterUsersDto,
  ZGetTableColumnDictDto,
  ZGetUserPreviewDto,
} from "./user.classes";
import { DEFAULT_USER_ATTRIBUTES_SERVER, DEFAULT_USER_CATALOGS, SAP_INTERNAL_COLUMN_NAME, SAP_SOURCE_TYPE } from "./user.constants";
import {
  CreateUserDtoAttributes,
  CreateUserDtoDomain,
  DomainDiffServer,
  GetDictUserDtoAggResult,
  LockedDomain,
  MergedPermissionTable,
  PopulatedUserPermissionTable,
  SplitedDomainDiffServer,
  UserExcel,
} from "./user.interfaces";
import {
  getDomainsDiffServer,
  getPermissionTablesDiffServer,
  mergeAttributesWithGroupsServer,
  mergeDomainsWithGroupsServer,
  mergePermissionTablesWithGroupsServer,
} from "./user.utils";
import { GET_DATA_PERMISSIONS_FULL_PERMISSION_TABLES, GET_USERS_WITH_FULL_DATA, OBFUSCATE_UNIQUE_POPULATIONS } from "./users.aggregations";
import {
  AddUserCatalogsDto,
  CheckUsersExistenceByUserIdsRes,
  ColumnWithStatus,
  DeleteUserCatalogsDto,
  EditUserCatalogsDto,
  GetUserDomainsByUserId,
  UserWithTrinoDataDto,
  ZCreateUserDto,
  ZEditUserDto,
  ZEditUserResDto,
  ZGetDictUserDto,
  ZGetPermissionTablesOptionsDto,
  ZGetUserDto,
  ZGetUserPermissionTablesOptionsReqDto,
  ZGetUsersDictionaryDto,
  ZGetUsersResponseDto,
  ZTablePreviewDto,
  getUserSchemaWithObjectIdTransform,
} from "./users.dto";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  /**@deprecated */
  private readonly usersCollection: Collection<User>;

  constructor(
    @Inject(DB_CONNECTION_PROVIDER) private db: Db,
    @InjectModel(SapPermittedUsers.name) private readonly sapPermittedUsersModel: Model<SapPermittedUsers>,
    private readonly auditingService: AuditingService,
    private readonly secretService: SecretService,
    private readonly permissionTableService: PermissionTablesService,
    @Inject(forwardRef(() => PermissionGroupsService))
    private readonly permissionGroupService: PermissionGroupsService,
    private readonly userInfoService: UserInfoService,
    private readonly excelService: ExcelService,
    private readonly ioredis: IORedis,
    private readonly openFgaService: OpenFgaService,
    private readonly trinoService: TrinoService,
    private readonly tableService: TableService,
    @Inject(OPA_PROVIDE) private readonly opaApi: OpaApi,
    @InjectModel(MongooseTable.name) private readonly tableModel: Model<MongooseTable>,
    @InjectModel(MongooseUser.name) private readonly userModel: Model<MongooseUser>,
  ) {
    this.usersCollection = this.db.collection<User>("users");
  }

  /**
   * @throws {NotFoundException}
   */
  private async getUserById<P extends keyof WithId<User>>(
    identifier: { _id: ObjectId } | { user_id: UserID },
    properties?: P[],
  ): Promise<Pick<WithId<User>, P>> {
    const projection =
      properties?.reduce<Record<string, boolean>>(
        (acc, property) => {
          acc[property] = true;

          return acc;
        },
        { _id: false },
      ) ?? {};

    const user = await this.usersCollection.findOne<Pick<WithId<User>, P>>(
      { ...identifier, "catalogs.datalake": { $exists: true } },
      { projection },
    );

    if (!user) {
      throw new NotFoundException(`Could not find a user with identifier: ${identifier}`);
    }

    return user;
  }

  async getFullDataUserById(
    identifier: { _id: ObjectId } | { user_id: string },
    withUniquePopulation: boolean = false,
  ): Promise<ZGetUserDto | null> {
    const OBFUSCATION = !withUniquePopulation ? OBFUSCATE_UNIQUE_POPULATIONS : [];
    const GET_USER_BY_ID_WITH_FULL_DATA = [{ $match: identifier }, ...GET_USERS_WITH_FULL_DATA, ...OBFUSCATION];
    const users = await this.userModel.aggregate<ZGetUserDto>(GET_USER_BY_ID_WITH_FULL_DATA).exec();

    const user = users[0];

    if (!user) {
      return null;
    }

    return getUserSchemaWithObjectIdTransform.parse(user);
  }

  private toUserDomainsDict(user: {
    domains: Pick<UserDomain, "id" | "classifications">[];
    permission_groups?: Pick<PermissionGroup, "domains">[];
  }): ZGetDictUserDto["domains"] {
    const mergedDomains: ZGetDictUserDto["domains"] = {};
    const domains = [...user.domains, ...(user.permission_groups?.flatMap(({ domains }) => domains) ?? [])];

    domains.forEach((domain) => {
      const domainId = domain.id.toString();
      if (!mergedDomains[domainId]) {
        mergedDomains[domainId] = {
          classifications: [],
        };
      }

      mergedDomains[domainId]!.classifications = [
        ...new Set([...mergedDomains[domainId]!.classifications, ...domain.classifications.map(String)]),
      ];
    });

    return mergedDomains;
  }

  async getUsersDictionary(): Promise<ZGetUsersDictionaryDto> {
    const redisValue = await this.ioredis.get(REDIS_KEYS.USERS_DICT);

    if (redisValue) {
      return JSON.parse(redisValue);
    }

    const GET_USERS_AS_OBJ_WITHOUT_DIMESIONS = [
      {
        $match: {
          "attributes.blocked": {
            $ne: true,
          },
        },
      },
      {
        $addFields: { hasNoPermissionTables: { $eq: ["$permission_tables", []] } },
      },
      ...GET_DATA_PERMISSIONS_FULL_PERMISSION_TABLES("permission_tables"),
      {
        $group: {
          _id: "$_id",
          user_id: {
            $first: "$user_id",
          },
          attributes: {
            $first: "$attributes",
          },
          catalogs: {
            $first: "$catalogs",
          },
          domains: {
            $first: "$domains",
          },
          permission_groups: {
            $first: "$permission_groups",
          },
          hasNoPermissionTables: {
            $first: "$hasNoPermissionTables",
          },
          permission_tables: {
            $push: "$permission_tables",
          },
        },
      },
      {
        $addFields: {
          permission_tables: {
            $cond: {
              if: "$hasNoPermissionTables",
              then: [],
              else: "$permission_tables",
            },
          },
        },
      },
      {
        $lookup: {
          from: "permission_groups",
          localField: "permission_groups.id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: true,
                name: true,
                domains: true,
                permission_tables: true,
                attributes: true,
              },
            },
          ],
          as: "permission_groups",
        },
      },
      {
        $addFields: { hasNoPermissionGroups: { $eq: ["$permission_groups", []] } },
      },
      {
        $unwind: {
          path: "$permission_groups",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: { groupHasNoPermissionTables: { $eq: ["$permission_groups.permission_tables", []] } },
      },
      ...GET_DATA_PERMISSIONS_FULL_PERMISSION_TABLES("permission_groups.permission_tables"),
      {
        $group: {
          _id: {
            docId: "$_id",
            permissionGroupId: "$permission_groups._id",
          },
          user_id: {
            $first: "$user_id",
          },
          attributes: {
            $first: "$attributes",
          },
          catalogs: {
            $first: "$catalogs",
          },
          domains: {
            $first: "$domains",
          },
          groupHasNoPermissionTables: {
            $first: "$groupHasNoPermissionTables",
          },
          hasNoPermissionGroups: {
            $first: "$hasNoPermissionGroups",
          },
          permission_tables: {
            $first: "$permission_tables",
          },
          permission_group_permission_tables: {
            $push: "$permission_groups.permission_tables",
          },
          permission_group: {
            $first: "$permission_groups",
          },
        },
      },
      {
        $set: {
          "permission_group.permission_tables": {
            $cond: {
              if: "$groupHasNoPermissionTables",
              then: [],
              else: "$permission_group_permission_tables",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.docId",
          user_id: {
            $first: "$user_id",
          },
          attributes: {
            $first: "$attributes",
          },
          catalogs: {
            $first: "$catalogs",
          },
          domains: {
            $first: "$domains",
          },
          permission_tables: {
            $first: "$permission_tables",
          },
          hasNoPermissionGroups: {
            $first: "$hasNoPermissionGroups",
          },
          permission_groups: {
            $push: {
              _id: "$_id.permissionGroupId",
              permission_tables: "$permission_group.permission_tables",
              domains: "$permission_group.domains",
              attributes: "$permission_group.attributes",
            },
          },
        },
      },
      {
        $set: {
          permission_groups: {
            $cond: {
              if: "$hasNoPermissionGroups",
              then: [],
              else: "$permission_groups",
            },
          },
        },
      },
    ] as const satisfies PipelineStage[];

    const usersList = await this.userModel.aggregate<GetDictUserDtoAggResult>(GET_USERS_AS_OBJ_WITHOUT_DIMESIONS).exec();

    if (!usersList.length) {
      throw new HttpException("לא נמצאו משתמשים", HttpStatus.NO_CONTENT);
    }
    const users = usersList.reduce((acc, currUser) => {
      const mergedDomains = this.toUserDomainsDict(currUser);
      const mergedPermissionTables = mergePermissionTablesWithGroupsServer(currUser);
      const mergedAttributes = mergeAttributesWithGroupsServer(currUser);

      const dimensions: ZGetDictUserDto["dimensions"] = {};
      mergedPermissionTables.forEach((permissionTable) => {
        dimensions[permissionTable.name] = this.generateWhereClauseRegularRowFilters(permissionTable);
      });

      const user: ZGetDictUserDto = {
        user_id: currUser.user_id,
        attributes: {
          ...currUser.attributes,
          ...mergedAttributes,
          mask: mergedAttributes.mask.value,
          deceased_population: mergedAttributes.deceased_population.value,
        },
        dimensions,
        domains: mergedDomains,
        catalogs: currUser.catalogs,
      };

      acc[currUser.user_id] = user;

      return acc;
    }, {});

    // cache for 15 minutes
    this.ioredis.set(REDIS_KEYS.USERS_DICT, JSON.stringify(users), "EX", 60 * 15);

    return users;
  }

  private calcWhereClauseFilterValue(value: UserRowFilter["values"][number]["value"], type: RowFilter["type"]) {
    const conversionMap = {
      integer: value,
      boolean: !value,
      string: `'${value}'`,
    } satisfies { [key in RowFilter["type"]]: unknown };

    return conversionMap[type] ?? value;
  }

  private generateWhereClauseRegularRowFilters(permissionTable: GetDictUserDtoAggResult["permission_tables"][number]): string {
    const otherAndOperatorFilters = new Set(["kod_sug_sherut", "kod_darga"]);
    const nifgaimOrOperatorFilters = new Set(["kod_yechida", "kod_chail", "kod_yechidat_makor"]);

    const rowFilters: GetDictUserDtoAggResult["permission_tables"][number]["row_filters"] = permissionTable.row_filters ?? [];
    const andOperatorClause: string[] = [];
    const orOperatorClause: string[] = [];

    rowFilters.forEach((filter) => {
      if (!filter.values) return;

      // remove boolean values that are true from where clause
      const values = filter.values.filter((value) => !(filter.type === "boolean" && Boolean(value.value) === true));

      if (values.length > 0) {
        const isOtherAndFilter = otherAndOperatorFilters.has(filter.kod);
        const isNifgaim = permissionTable.name === "datalake.permissions.nifgaim_permissions";
        const isNifgaimOrOperatorFilters = nifgaimOrOperatorFilters.has(filter.kod);
        const operator = "or";

        const condition = values
          .map((value) => `${filter.kod}=${this.calcWhereClauseFilterValue(value.value, filter.type)}`)
          .join(` ${operator} `);

        if (isOtherAndFilter || (isNifgaim && !isNifgaimOrOperatorFilters)) {
          andOperatorClause.push(`(${condition})`);
        } else {
          orOperatorClause.push(`(${condition})`);
        }
      }
    });

    const operatorClauses: string[] = [];

    if (andOperatorClause.length > 0) {
      operatorClauses.push(`(${andOperatorClause.join(" and ")})`);
    }

    if (orOperatorClause.length > 0) {
      operatorClauses.push(`(${orOperatorClause.join(" or ")})`);
    }

    const whereClause = operatorClauses.length > 0 ? operatorClauses.join(" and ") : EMPTY_WHERE_CLAUSE;

    return whereClause;
  }

  async invalidateUsersDictCache() {
    try {
      await this.ioredis.del(REDIS_KEYS.USERS_DICT);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getUsersWithTrinoData(): Promise<UserWithTrinoDataDto[]> {
    const users = await this.usersCollection
      .find<Pick<User, "user_id">>(
        {
          "attributes.blocked": { $ne: true },
        },
        { projection: { _id: false, user_id: true } },
      )
      .toArray();

    const userIds = users.map((user) => user.user_id);

    const usersTrinoData = await this.userInfoService.getTrinoUsersDataByUserIds(userIds, [
      "mispar_ishi",
      "shem_male",
      "shem_darga",
      "shem_yechida",
    ]);

    const usersTrinoDataByMisparIshi = usersTrinoData.reduce<Record<string, (typeof usersTrinoData)[number]>>(
      (acc, user) => ({
        ...acc,
        [user.mispar_ishi]: user,
      }),
      {},
    );

    const formattedUsers: UserWithTrinoDataDto[] = users.map((user) => {
      const userIdWithoutPrefix = UserInfoService.getUserIdWithoutPrefix(user.user_id);
      const trinoDataUser = usersTrinoDataByMisparIshi[userIdWithoutPrefix];

      if (!trinoDataUser) {
        return user;
      }

      return {
        ...user,
        info: {
          shem_darga: trinoDataUser.shem_darga,
          shem_male: trinoDataUser.shem_male,
          shem_yechida: trinoDataUser.shem_yechida,
        },
      };
    });

    return formattedUsers;
  }

  async getUnblockedUsers({
    search,
    page,
    filters,
    includeUniquePopulation = false,
  }: {
    search?: string;
    page?: number;
    filters?: ZFilterUsersDto;
    includeUniquePopulation?: boolean;
  }): Promise<ZGetUsersResponseDto> {
    const limit = page && USERS_PER_PAGE;
    const skip = page && USERS_PER_PAGE * (page - 1);
    const loweredSearchTerm = search?.toLowerCase();

    if (filters.specialProperties && filters.specialProperties.includes(specialProperties.unique_population) && !includeUniquePopulation) {
      throw new ForbiddenException("אין לך אפשרות לחפש אנשים עם אוכלוסיות מיוחדות");
    }

    const querySearch =
      loweredSearchTerm &&
      ([
        {
          $addFields: {
            fullName: {
              $concat: ["$first_name", " ", "$last_name"],
            },
          },
        },
        {
          $match: {
            $or: [{ fullName: { $regex: loweredSearchTerm, $options: "i" } }, { user_id: { $regex: loweredSearchTerm, $options: "i" } }],
          },
        },
        {
          $unset: ["domain_data", "fullName"],
        },
      ] as const satisfies PipelineStage[]);

    const userFilterFunctions: { [key in keyof ZFilterUsersDto]: (value: ZFilterUsersDto[key]) => PipelineStage[] | PipelineStage } = {
      domains: (domains) => {
        return [
          {
            $lookup: {
              from: "permission_groups",
              localField: "permission_groups.id",
              foreignField: "_id",
              as: "permmision_groups_full_info",
            },
          },
          {
            $addFields: {
              totalDomains: {
                $concatArrays: [
                  "$domains",
                  {
                    $reduce: {
                      input: "$permmision_groups_full_info",
                      initialValue: [],
                      in: {
                        $concatArrays: ["$$value", "$$this.domains"],
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            $match: {
              $and: domains.map((currDomain) =>
                currDomain.selectedClassifications.length === 0
                  ? { totalDomains: { $elemMatch: { id: currDomain._id } } }
                  : {
                      totalDomains: {
                        $elemMatch: {
                          id: currDomain._id,
                          classifications: {
                            $all: currDomain.selectedClassifications.map((selectedClassification) => selectedClassification._id),
                          },
                        },
                      },
                    },
              ),
            },
          },
        ];
      },
      userTypes: (userTypes) => {
        return {
          $match: {
            "attributes.type": {
              $in: userTypes,
            },
          },
        };
      },
      permissionGroups: (permissionGroups) => {
        return {
          $match: {
            permission_groups: {
              $elemMatch: {
                id: { $in: permissionGroups.map((permissionGroup) => permissionGroup._id) },
              },
            },
          },
        };
      },
      authorizationSource: (authorizationSource) => {
        return authorizationSource === AuthorizationSource.ALL
          ? []
          : [
              {
                $lookup: {
                  from: "sap_permitted_users",
                  localField: "user_id",
                  foreignField: "user_id",
                  as: "sapUsers",
                },
              },
              authorizationSource === AuthorizationSource.SAP ? { $match: { sapUsers: { $ne: [] } } } : { $match: { sapUsers: [] } },
            ];
      },
      specialProperties: (specialPropertiesInput) => {
        if (specialPropertiesInput.length === 0) {
          return [];
        }
        return [
          {
            $lookup: {
              from: "permission_groups",
              localField: "permission_groups.id",
              foreignField: "_id",
              as: "permmision_groups_full_info",
            },
          },
          {
            $match: {
              $or: [
                ...(specialPropertiesInput.includes(specialProperties.mask)
                  ? [
                      {
                        $or: [
                          { "attributes.mask": false },
                          {
                            permmision_groups_full_info: {
                              $elemMatch: {
                                "attributes.mask": false,
                              },
                            },
                          },
                        ],
                      },
                    ]
                  : []),
                ...(specialPropertiesInput.includes(specialProperties.deceased_population)
                  ? [
                      {
                        $or: [
                          { "attributes.deceased_population": true },
                          {
                            permmision_groups_full_info: {
                              $elemMatch: {
                                "attributes.deceased_population": true,
                              },
                            },
                          },
                        ],
                      },
                    ]
                  : []),
                ...(specialPropertiesInput.includes(specialProperties.unique_population)
                  ? [{ "attributes.unique_population": { $ne: [] } }]
                  : []),
              ],
            },
          },
        ];
      },
    };

    const searchByAdvancedFilters =
      filters &&
      getObjectEntries(userFilterFunctions)
        .filter(([filterDiscription]) => !!filters[filterDiscription] && filters[filterDiscription].length > 0)
        .flatMap(([filterDiscription, mongoFunction]) => mongoFunction(filters[filterDiscription] as any));

    const OBFUSCATION = !includeUniquePopulation ? OBFUSCATE_UNIQUE_POPULATIONS : [];

    const SORT_BY_LAST_CHANGED = [
      {
        $addFields: {
          maxLastChanged: {
            $max: [
              { $max: "$domains.last_change" },
              { $max: "$permission_tables.last_change" },
              { $max: "$permission_groups.registration_date" },
            ],
          },
        },
      },
      {
        $sort: {
          maxLastChanged: -1,
        },
      },
      {
        $project: {
          maxLastChanged: false,
        },
      },
    ] as const satisfies PipelineStage[];

    const unblockedUsers = {
      $match: {
        "attributes.blocked": {
          $ne: true,
        },
      },
    };

    const GET_UNBLOCKED_USERS_WITH_FULL_DATA = [
      // Get all unblocked users
      unblockedUsers,
      ...(querySearch || []),
      ...(searchByAdvancedFilters || []),
      ...SORT_BY_LAST_CHANGED,
      { $skip: skip || 0 },
      ...(limit ? [{ $limit: limit }] : []),
      ...GET_USERS_WITH_FULL_DATA, // can cause  bug where doesnt show the limit amout per page
      ...OBFUSCATION,
      ...SORT_BY_LAST_CHANGED, // page sorting was ruined by grouping in get users with full data, so sort again
    ] as const satisfies PipelineStage[];

    const [users, metadata] = await Promise.all([
      this.userModel.aggregate<ZGetUserDto>(GET_UNBLOCKED_USERS_WITH_FULL_DATA).exec(),
      this.userModel.aggregate([unblockedUsers, ...(querySearch || []), ...(searchByAdvancedFilters ?? [])]).count("totalCount"),
    ]);

    return {
      users: getUserSchemaWithObjectIdTransform.array().parse(users),
      metadata,
    };
  }

  async getUnblockedUserByUserId(userId: UserID, sessionUserId: UserID): Promise<ZGetUserDto> {
    const hasUniquePopulationsAuthz = await this.hasPermissionsForUniquePopulations(sessionUserId);
    const user = await this.getFullDataUserById({ user_id: userId }, hasUniquePopulationsAuthz);

    if (!user) throw new NotFoundException();
    if (user.attributes.blocked) throw new BadRequestException("This user is blocked");

    return user;
  }

  async getIsUserSapPermittedByUserId(userId: UserID): Promise<boolean> {
    const result = await this.sapPermittedUsersModel.findOne({ user_id: userId }, { user_id: true });

    return !!result;
  }

  async getUserDomainByUserId(userId: UserID): Promise<GetUserDomainsByUserId> {
    const pipeline = [
      { $match: { user_id: userId } },
      { $project: { _id: false, domains: true } },
      {
        $lookup: {
          from: "domains",
          localField: "domains.id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: true,
                display_name: true,
              },
            },
          ],
          as: "domains",
        },
      },
      { $unwind: "$domains" },
      { $replaceRoot: { newRoot: "$domains" } },
    ];

    const domains = await this.usersCollection.aggregate<GetUserDomainsByUserId[number]>(pipeline).toArray();

    return domains;
  }

  async getUsersExcel(userId: UserID, search?: string, filters?: ZFilterUsersDto): Promise<unknown> {
    const hasUniquePopulationsAuthz = await this.hasPermissionsForUniquePopulations(userId);
    const { users } = await this.getUnblockedUsers({ search, includeUniquePopulation: hasUniquePopulationsAuthz, filters });

    const usersExcel = users.flatMap((user) => {
      const mergedDomains = mergeDomainsWithGroupsServer(user);

      return mergedDomains.map<UserExcel>((userDomain) => {
        const uniqueAddition = hasUniquePopulationsAuthz
          ? {
              unique_population: user.attributes.unique_population.length === 0 ? "ללא" : user.attributes.unique_population.join(", "),
            }
          : {};

        return {
          user_id: user.user_id,
          full_name: toFullName(user),
          type: user.attributes.type,
          mask: user.attributes.mask ? "כן" : "לא",
          deceased_population: user.attributes.deceased_population ? "עם" : "ללא",
          domain_display_name: userDomain.display_name,
          classifications: userDomain.classifications.map((classification) => classification.name).join(", "),
          given_by: userDomain.given_by?.user_id,
          create_date: formatDate(userDomain.create_date),
          last_changed_by: userDomain.last_changed_by?.user_id,
          last_change: formatDate(userDomain.last_change),
          ...uniqueAddition,
        };
      });
    });

    const uniqueColumn = hasUniquePopulationsAuthz
      ? [{ name: "unique_population", displayName: "אוכלוסיות מיוחדות", options: { wch: 12 } } as const]
      : [];

    const usersExcelFile = this.excelService.convertToExcel(usersExcel, [
      { name: "user_id", displayName: "מספר אישי", options: { wch: 8 } },
      { name: "full_name", displayName: "שם מלא", options: { wch: 13 } },
      { name: "type", displayName: "סוג משתמש", options: { wch: 9 } },
      { name: "mask", displayName: "מותמם", options: { wch: 5 } },
      ...uniqueColumn,
      { name: "deceased_population", displayName: "אוכלוסיית נפטרים", options: { wch: 12 } },
      { name: "domain_display_name", displayName: "עולם תוכן", options: { wch: 16 } },
      { name: "classifications", displayName: "סיווגים", options: { wch: 80 } },
      { name: "given_by", displayName: 'הרשאה ניתנה ע"י', options: { wch: 13 } },
      { name: "create_date", displayName: "תאריך יצירה", options: { wch: 9 } },
      { name: "last_changed_by", displayName: 'הרשאה עודכנה ע"י', options: { wch: 13 } },
      { name: "last_change", displayName: "תאריך שינוי אחרון", options: { wch: 13 } },
    ]);

    return usersExcelFile;
  }

  async getPermissionTablesOptions(domains: ZGetUserPermissionTablesOptionsReqDto["domains"]): Promise<ZGetPermissionTablesOptionsDto> {
    if (!domains.length) {
      return [];
    }

    const permissionTables = await this.tableModel
      .aggregate<PermissionTableDocument>([
        {
          $match: {
            $expr: {
              $let: {
                vars: {
                  classifications: {
                    $switch: {
                      branches: domains.map((domain) => ({
                        case: { $eq: ["$attributes.domain_id", domain.id] },
                        then: domain.classifications,
                      })),
                      default: [],
                    },
                  },
                },
                in: {
                  $and: [
                    {
                      $ne: ["permission_table", undefined],
                    },
                    {
                      $ne: ["permission_table", null],
                    },
                    {
                      $ne: ["$$classifications", []],
                    },
                    {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: { $objectToArray: "$columns_dict" },
                              as: "columns_dict_array",
                              cond: {
                                $in: ["$$columns_dict_array.v.attributes.classification", "$$classifications"],
                              },
                            },
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ])
      .group({
        _id: "$permission_table",
      })
      .project({ _id: false, permission_table_id: "$_id" })
      .lookup({
        from: "permission_tables",
        localField: "permission_table_id",
        foreignField: "_id",
        as: "permission_table",
      })
      .unwind("$permission_table")
      .replaceRoot("$permission_table")
      .sort({ display_name: 1 })
      .exec();

    return permissionTables.map((permissionTable) => {
      const defaultRowFilters: ZGetPermissionTablesOptionsDto[number]["row_filters"] = permissionTable.row_filters.map((rowFilter) => ({
        kod: rowFilter.kod,
        display_name: rowFilter.display_name,
        query_builder_type: rowFilter.query_builder_type,
        type: rowFilter.type,
        values: rowFilter.type === BOOLEAN_TYPE ? [{ value: 0, display_name: "לא" }] : [],
      }));

      return {
        id: permissionTable._id,
        name: permissionTable.name,
        display_name: permissionTable.display_name,
        row_filters: defaultRowFilters,
        permission_keys: permissionTable.permission_keys,
      };
    });
  }

  /**
   * @audits
   */
  async blockUser(userId: UserID, approverId: UserID): Promise<UpdateResult<User>> {
    const user = await this.usersCollection.findOne({ user_id: userId });
    if (!user) throw new NotFoundException();
    try {
      // TODO - is the return type necessary
      const updatedUser = await this.usersCollection.updateOne(
        { user_id: userId },
        { $set: { attributes: { ...user.attributes, blocked: true } } },
      );

      this.invalidateUsersDictCache();

      this.auditingService.insertLegacyAudit({
        user_id: approverId,
        operation: OP.Update,
        resource: Resource.User,
        status: "success",
        resource_info: {
          id: user._id.toString(),
          name: user.user_id,
        },
        message: "Blocked User",
        difference: customDiff({ attributes: { blocked: user.attributes.blocked } }, { attributes: { blocked: true } }, false),
      });

      await this.secretService.generateNewSecret();

      return updatedUser;
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: approverId,
        operation: OP.Update,
        resource: Resource.User,
        status: "error",
        resource_info: {
          id: user._id.toString(),
          name: user.user_id,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw error;
    }
  }

  /**
   * @audits
   */
  async deleteUserDomainByDomainId(id: ObjectId, domainId: ObjectId, loggedUser: LoggedUser) {
    try {
      const [{ allowed }, hasUniquePopulationsAuthz] = await Promise.all([
        this.openFgaService.check({
          user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
          relation: FGADomainRelationConstants.can_manage_data_permissions,
          object: formatFGAObjectId({ type: "domain", id: domainId.toString() }),
        }),
        this.hasPermissionsForUniquePopulations(loggedUser.userId),
      ]);

      if (!allowed) {
        throw new ForbiddenException(`No permissions found for domain with id ${domainId}`);
      }

      const [prevUser] = await this.userModel
        .aggregate<WithId<Omit<MongooseUser, "permission_groups"> & { permission_groups: PermissionGroup[] }>>()
        .match({ _id: id })
        .lookup({
          from: "permission_groups",
          foreignField: "_id",
          localField: "permission_groups.id",
          as: "permission_groups",
        })
        .exec();

      if (!prevUser) {
        throw new NotFoundException(`User not found for id ${id}`);
      }

      const remainingDirectUserDomains = prevUser.domains.filter((domain) => !domain.id.equals(domainId));

      const remainingUserDomains = [
        ...remainingDirectUserDomains,
        ...prevUser.permission_groups.flatMap((permission_group) => permission_group.domains),
      ];

      const permissionTables = await this.getPermissionTablesOptions(remainingUserDomains);
      const permissionTableIds = new Set(permissionTables.map(({ id }) => id.toString()));
      const remainingUserPermissionTables = prevUser.permission_tables.filter((permission_table) =>
        permissionTableIds.has(permission_table.id.toString()),
      );

      await this.userModel.updateOne(
        { _id: id },
        { domains: remainingDirectUserDomains, permission_tables: remainingUserPermissionTables },
      );

      this.invalidateUsersDictCache();

      const domainsDiff = getDomainsDiffServer(prevUser.domains, remainingDirectUserDomains, {
        splitClassifications: true,
        returnDeletedClassifications: true,
      });
      const permissionTablesDiff = getPermissionTablesDiffServer(prevUser.permission_tables, remainingUserPermissionTables);

      this.auditingService.insertUserAudits({
        actorUserId: loggedUser.userId,
        operation: OP.Update,
        resource_id: prevUser._id,
        domainsDiff,
        permissionTablesDiff,
        userAttributesDiff: [],
        permissionGroupDiff: { newPermissionGroups: [], deletedPermissionGroups: [] },
      });

      return await this.getFullDataUserById({ _id: prevUser._id }, hasUniquePopulationsAuthz);
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: loggedUser.userId,
        operation: OP.Update,
        resource: Resource.User,
        status: "error",
        resource_info: {
          id: id.toString(),
          name: AUDITING_UNKNOWN,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw error;
    }
  }

  /**
   * @audits
   */
  async deleteUserById(id: ObjectId, approverId: UserID): Promise<void> {
    try {
      const user = await this.usersCollection.findOneAndUpdate(
        { _id: id },
        {
          $unset: {
            "catalogs.datalake": 1,
          },
        },
        { returnDocument: "before" },
      );

      if (!user) {
        throw new NotFoundException(`משתמש בעל ה_id לא נמצא ${id}`);
      }

      this.invalidateUsersDictCache();

      const domainsDiff = getDomainsDiffServer(user.domains, [] as UserDomain[], {
        splitClassifications: true,
        returnDeletedClassifications: true,
      });
      const permissionTablesDiff = getPermissionTablesDiffServer(user.permission_tables, [] as UserPermissionTable[]);
      const userAttributesDiff = getUserAttributesDiff({ currUserAttributes: user.attributes });

      this.auditingService.insertUserAudits({
        actorUserId: approverId,
        operation: OP.Delete,
        resource_id: user._id,
        domainsDiff,
        permissionTablesDiff,
        userAttributesDiff,
        permissionGroupDiff: { newPermissionGroups: [], deletedPermissionGroups: user.permission_groups.map((group) => group.id) },
      });
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: approverId,
        operation: OP.Delete,
        resource: Resource.User,
        status: "error",
        resource_info: {
          id: id.toString(),
          name: AUDITING_UNKNOWN,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw error;
    }
  }

  async checkUsersExistenceByUserIds(userIds: User["user_id"][]): Promise<CheckUsersExistenceByUserIdsRes> {
    const existingUsers = await this.usersCollection
      .find<Pick<User, "user_id">>(
        {
          user_id: { $in: userIds },
          "catalogs.datalake": { $exists: true },
        },
        { projection: { user_id: true } },
      )
      .toArray();

    const existingUsersIds = new Set(existingUsers.map(({ user_id }) => user_id));

    return userIds.reduce<CheckUsersExistenceByUserIdsRes>((acc, userId) => {
      acc[userId] = existingUsersIds.has(userId);

      return acc;
    }, {});
  }

  /**
   * @audits
   * @throws {ConflictException, ForbiddenException}
   */
  async cloneUsers(sourceUserId: User["user_id"], destinationUserIds: User["user_id"][], loggedUser: LoggedUser): Promise<void> {
    try {
      const [sourceUser, checkUsersExistence, destinationUsersInfo] = await Promise.all([
        this.getUserById({ user_id: sourceUserId }),
        this.checkUsersExistenceByUserIds(destinationUserIds),
        this.getUsersInfoByUserIds(destinationUserIds),
      ]);

      Object.entries(checkUsersExistence).forEach(async ([userId, isUserExits]) => {
        if (isUserExits) {
          throw new ConflictException(
            `user ${loggedUser.userId} cannot clone from source user ${sourceUserId} to destination user ${userId} - user already exists`,
          );
        }
      });

      const { resultDomains, resultClassifications } = await this.checkPermissionForDomains(loggedUser.userId, sourceUser.domains);
      const domainsNotAllowed = new Set();

      resultDomains.forEach((domain) => {
        if (!domain.allowed) {
          const domainId = parseFGAObjectId(domain.request.object)?.id;

          if (domainId) {
            domainsNotAllowed.add(domainId);
          }
        }
      });
      resultClassifications.forEach((classification) => {
        if (!classification.allowed) {
          const result = OpenFgaService.extractDomainClassification(classification.request.object);

          if (result) {
            domainsNotAllowed.add(result.domain);
          }
        }
      });

      const allowedSourceDomains = sourceUser.domains.filter((domain) => !domainsNotAllowed.has(domain.id.toString()));

      await this.handleNewClonedUsers(sourceUser, allowedSourceDomains, destinationUserIds, destinationUsersInfo, loggedUser);

      this.invalidateUsersDictCache();
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: loggedUser.userId,
        operation: OP.Create,
        resource: Resource.User,
        status: "error",
        resource_info: {
          id: sourceUserId,
          name: destinationUserIds.join(", "),
        },
        message: stringify(error),
        response_error_message: "error in cloneUsers",
      });

      throw error;
    }
  }

  private async getUsersInfoByUserIds(user_ids: UserID[]) {
    const result = await Promise.all(user_ids.map((user_id) => this.userInfoService.getUserInfoByUserId(user_id, true)));

    return result.reduce<{ [user_id: string]: GetUserInfoDto }>((userInfoResponesAcc, currentUserInfoResponse) => {
      userInfoResponesAcc[currentUserInfoResponse.user_id] = currentUserInfoResponse;

      return userInfoResponesAcc;
    }, {});
  }

  private async handleNewClonedUsers(
    sourceUser: WithId<User>,
    allowedSourceDomains: UserDomain[],
    destinationUserIds: User["user_id"][],
    destinationUsersInfo: {
      [user_id: UserID]: GetUserInfoDto;
    },
    loggedUser: LoggedUser,
  ): Promise<void> {
    const now = new Date();
    const formattedDomains = allowedSourceDomains.map<UserDomain>((domain) => ({
      ...domain,
      create_date: now,
      given_by: loggedUser.userId,
      last_change: now,
      last_changed_by: loggedUser.userId,
    }));

    const formattedPermissionTables = this.addAuditMetaDataUserPermissionTables(loggedUser.userId, now, sourceUser.permission_tables);

    const operations: AnyBulkWriteOperation<User>[] = destinationUserIds.map((destinationsUserId) => {
      const userInfo = destinationUsersInfo[destinationsUserId];

      return {
        updateOne: {
          filter: { user_id: destinationsUserId },
          update: {
            $set: {
              ...Object.fromEntries(Object.entries(DEFAULT_USER_CATALOGS).map(([k, v]) => [`catalogs.${k}`, v])),
              attributes: DEFAULT_USER_ATTRIBUTES_SERVER,
              domains: formattedDomains,
              permission_tables: formattedPermissionTables,
              ...(userInfo.first_name ? { first_name: userInfo.first_name } : {}),
              ...(userInfo.last_name ? { last_name: userInfo.last_name } : {}),
              permission_groups: [],
            },
          },
          upsert: true,
        } as UpdateOneModel<User>,
      };
    });

    const bulkWriteResult = await this.usersCollection.bulkWrite(operations);
    this.handleCloneUsersAudit(
      destinationUserIds,
      formattedDomains,
      formattedPermissionTables,
      DEFAULT_USER_ATTRIBUTES_SERVER,
      bulkWriteResult,
      loggedUser,
    );
  }

  private async handleCloneUsersAudit(
    destinationUserIds: UserID[],
    newDomains: UserDomain[],
    newPermissionTables: UserPermissionTable[],
    newAttributes: UserAttributes,
    bulkWriteResult: BulkWriteResult,
    loggedUser: LoggedUser,
  ) {
    const updatedUsersIds = destinationUserIds.filter((_, index) => !bulkWriteResult.upsertedIds[index]);

    const updatedUsers =
      updatedUsersIds.length > 0 ? await this.userModel.find({ user_id: { $in: updatedUsersIds } }, { _id: true, user_id: true }) : [];
    const updatedUsersByIdMap = new Map(updatedUsers.map((user) => [user.user_id, user]));

    const domainsDiff = getDomainsDiffServer([] as UserDomain[], newDomains, {
      splitClassifications: true,
      returnDeletedClassifications: true,
    });
    const permissionTablesDiff = getPermissionTablesDiffServer([], newPermissionTables);
    const attributesDiff = getUserAttributesDiff({ newUserAttributes: newAttributes });
    const insertAuditData = destinationUserIds.map<InsertUserAudit>((destinationUserId, index) => {
      return {
        actorUserId: loggedUser.userId,
        operation: OP.Clone,
        // should always be defined - if not mongoose validation will kill the audit.
        resource_id: bulkWriteResult.upsertedIds[index] ?? updatedUsersByIdMap.get(destinationUserId)._id,
        domainsDiff,
        permissionTablesDiff,
        userAttributesDiff: attributesDiff,
        permissionGroupDiff: { deletedPermissionGroups: [], newPermissionGroups: [] },
      };
    });

    await this.auditingService.insertUserAudits(...insertAuditData);
  }

  /**
   * @audits
   */
  async createUser(createData: ZCreateUserDto, loggedUser: LoggedUser): Promise<ZGetUserDto> {
    try {
      const permissionGroups = await this.permissionGroupService.getPermissionGroupsByIds(
        createData.permission_groups.map(({ _id }) => _id),
      );

      if (permissionGroups.length !== createData.permission_groups.length) {
        throw new BadRequestException("Can't add permssion groups that don't exist");
      }

      const [hasUniquePopulationsAuthz] = await Promise.all([
        this.hasPermissionsForUniquePopulations(loggedUser.userId),
        this.assertHasPermissionsForSimpleAttributes(loggedUser.userId, createData.attributes, createData.domains),
        this.validateUniquePopulationOptions(createData.attributes.unique_population),
        this.checkPermissionForDomains(loggedUser.userId, createData.domains, {
          throw: true,
          message: (domainId: string) =>
            `User ${loggedUser.userId} is not allowed to create ${createData.user_id}: has no permission to the domain with id ${domainId}`,
        }),
        this.permissionGroupService.assertCanChangeGroupsUsers(loggedUser.userId, permissionGroups),
        this.assertAdminForOperation(!!createData.is_read_all, loggedUser.userId),
      ]);

      const newAttributes: UserAttributes = {
        ...createData.attributes,
        unique_population: hasUniquePopulationsAuthz ? createData.attributes.unique_population : [],
        impersonate: DEFAULT_USER_ATTRIBUTES_SERVER.impersonate,
      };

      const newPermissionTableIds = createData.permission_tables.map((permission_table) => permission_table.id);

      const [newUserInfo, permissionTables] = await Promise.all([
        this.userInfoService.getUserInfoByUserId(createData.user_id, true),
        this.permissionTableService.getPermissionTablesByIds(newPermissionTableIds, { throwIfNotAllFound: true }),
      ]);

      const populatedPermissionTables = this.populatePermissionTables(createData.permission_tables, permissionTables);
      this.assertUserPermissionTablesValid(populatedPermissionTables);

      const userPermissionTables = await this.mergeRowFilterValuesWithTrinoValues({
        isCreate: true,
        permissionTables: populatedPermissionTables,
      });

      const now = new Date();
      const newPermissionTables = this.addAuditMetaDataUserPermissionTables(loggedUser.userId, now, userPermissionTables);

      const existingDBObjUser = await this.userModel.findOne({ user_id: createData.user_id });
      const newDomains = createData.domains.map<UserDomain>((domain) => ({
        ...domain,
        create_date: now,
        given_by: loggedUser.userId,
        last_change: now,
        last_changed_by: loggedUser.userId,
      }));
      const newPermissionGroups = (createData.permission_groups ?? []).map<UserPermissionGroup>((permission_group) => ({
        id: permission_group,
        given_by: loggedUser.userId,
        registration_date: now,
      }));
      let newUser: ZGetUserDto;

      if (existingDBObjUser) {
        if (existingDBObjUser.catalogs.has("datalake")) {
          this.logger.error(`user ${existingDBObjUser.user_id} already exists`);
          throw new ConflictException("משתמש עם המספר האישי שנשלח כבר קיים במערכת");
        }
        const catalogs: MongooseUser["catalogs"] = new Map(
          Object.entries({ ...cloneDeep(DEFAULT_USER_CATALOGS), ...cloneDeep(Object.fromEntries(existingDBObjUser.catalogs.entries())) }),
        );

        if (createData.is_read_all) {
          catalogs.set("datalake", {
            ...DEFAULT_USER_CATALOGS.datalake,
            read_all: true,
          });
        }

        const user = await this.userModel.findOneAndUpdate(
          { user_id: createData.user_id },
          {
            $set: {
              attributes: newAttributes,
              domains: newDomains,
              catalogs,
              permission_tables: newPermissionTables,
              permission_groups: newPermissionGroups,
            },
          },
          { returnDocument: "after" },
        );

        newUser = await this.getFullDataUserById({ _id: user._id }, hasUniquePopulationsAuthz);
      } else {
        const catalogs: MongooseUser["catalogs"] = new Map(Object.entries(cloneDeep(DEFAULT_USER_CATALOGS)));
        if (createData.is_read_all) {
          catalogs.set("datalake", {
            ...DEFAULT_USER_CATALOGS.datalake,
            read_all: true,
          });
        }

        const insertData: MongooseUser = {
          user_id: createData.user_id,
          ...(newUserInfo.first_name ? { first_name: newUserInfo.first_name } : {}),
          ...(newUserInfo.last_name ? { last_name: newUserInfo.last_name } : {}),
          attributes: newAttributes,
          domains: newDomains,
          catalogs,
          permission_tables: newPermissionTables,
          permission_groups: newPermissionGroups,
        };
        const response = await this.userModel.create(insertData);

        newUser = await this.getFullDataUserById({ _id: response._id }, hasUniquePopulationsAuthz);
      }

      this.invalidateUsersDictCache();

      const domainsDiff = getDomainsDiffServer([], newDomains, { splitClassifications: true, returnDeletedClassifications: true });
      const permissionTablesDiff = getPermissionTablesDiffServer([], newPermissionTables);
      const attributesDiff = getUserAttributesDiff({ newUserAttributes: newAttributes });

      const permissionGroupDiff: PermissionGroupDiff = {
        newPermissionGroups: newUser.permission_groups.map((group) => group._id),
        deletedPermissionGroups: [],
      };

      this.auditingService.insertUserAudits({
        actorUserId: loggedUser.userId,
        operation: OP.Create,
        resource_id: newUser._id,
        domainsDiff,
        permissionTablesDiff,
        userAttributesDiff: attributesDiff,
        permissionGroupDiff,
      });

      return newUser;
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: loggedUser.userId,
        operation: OP.Create,
        resource: Resource.User,
        status: "error",
        resource_info: {
          id: AUDITING_UNKNOWN,
          name: createData.user_id,
        },
        message: stringify(error),
        response_error_message: isMongoDuplicateKeyError(error) ? "משתמש עם המספר האישי שנשלח כבר קיים במערכת" : AUDITING_UNKNOWN,
      });

      if (isMongoDuplicateKeyError(error)) throw new ConflictException("משתמש עם המספר האישי שנשלח כבר קיים במערכת");
      throw error;
    }
  }

  async assertAdminForOperation(operation: boolean, userId: UserID, message?: string) {
    if (operation && !(await this.openFgaService.isAdmin(userId))) {
      throw new ForbiddenException(message ?? `User ${userId} is not allowed to modify read_all`);
    }
  }

  /**
   * @audits
   * @important This Endpoint is used by customers
   */
  async editUser(id: ObjectId, editData: ZEditUserDto, loggedUser: LoggedUser): Promise<ZEditUserResDto> {
    try {
      const uneditedUserData = await this.getUserById({ _id: id });
      const domainsDiff = getDomainsDiffServer(uneditedUserData.domains, editData.domains, {
        splitClassifications: false,
        returnDeletedClassifications: false,
      });
      const existingPermissionGroups = uneditedUserData.permission_groups.map((permissionGroup) => permissionGroup.id);
      const [deletedPermissionGroups, newPermissionGroups] = calcSymetricDiff(
        uneditedUserData.permission_groups.map((permissionGroup) => permissionGroup.id),
        editData.permission_groups ?? existingPermissionGroups, // undefined permission_groups === don't change
        (value) => value.toString(),
      );

      const changedPermissionGroupIds = [...newPermissionGroups, ...deletedPermissionGroups];
      const changedPermissionGroups = await this.permissionGroupService.getPermissionGroupsByIds(changedPermissionGroupIds);

      if (changedPermissionGroups.length !== changedPermissionGroupIds.length) {
        throw new BadRequestException("Can't add or remove permssion groups that don't exist");
      }

      const [hasUniquePopulationsAuthz] = await Promise.all([
        this.hasPermissionsForUniquePopulations(loggedUser.userId),
        this.assertHasPermissionsForSimpleAttributes(loggedUser.userId, editData.attributes, editData.domains, uneditedUserData.attributes),
        this.validateUniquePopulationOptions(editData.attributes.unique_population),
        this.checkPermissionForDomains(loggedUser.userId, domainsDiff, {
          throw: true,
          message: (domainId: string) =>
            `User ${loggedUser.userId} is not allowed to edit ${id}: has no permission to the domain with id ${domainId}`,
        }),
        this.permissionGroupService.assertCanChangeGroupsUsers(loggedUser.userId, changedPermissionGroups),
        this.assertAdminForOperation(
          editData.is_read_all !== undefined && editData.is_read_all !== uneditedUserData.catalogs[DATALAKE_CATALOG_NAME]?.read_all,
          loggedUser.userId,
        ),
      ]);

      const updatedAttributes: UserAttributes = {
        ...uneditedUserData.attributes,
        ...editData.attributes,
        unique_population: hasUniquePopulationsAuthz
          ? editData.attributes.unique_population
          : uneditedUserData.attributes.unique_population,
      };

      const { finalDomains, lockedDomains } = await this.splitDomainsByUpdatability(
        editData.domains,
        uneditedUserData.domains,
        domainsDiff,
        loggedUser.userId,
      );

      const { finalPermisssionTables, lockedPermissionTables } = await this.splitPermissionTablesByUpdatability(
        editData.permission_tables,
        uneditedUserData.permission_tables,
        loggedUser.userId,
      );

      const permissionTables = await this.permissionTableService.getPermissionTablesByIds(
        finalPermisssionTables.map(({ id }) => id),
        { throwIfNotAllFound: true },
      );

      if (permissionTables.length !== finalPermisssionTables.length) {
        throw new BadRequestException("Can't add permssion tables that don't exist");
      }

      const populatedPermissionTables = this.populatePermissionTables(finalPermisssionTables, permissionTables);

      this.assertUserPermissionTablesValid(populatedPermissionTables);
      const mergedPermissionTables = this.mergePermissionTables(populatedPermissionTables, uneditedUserData.permission_tables);

      const permissionTablesWithNewRowFilterValues: MergedPermissionTable[] = mergedPermissionTables.filter((mergedPermissionTable) => {
        return mergedPermissionTable.row_filters.some((row_filter) => {
          return row_filter.values.some((value) => value.isNew);
        });
      });

      const userPermissionTables = await this.mergeRowFilterValuesWithTrinoValues({
        isCreate: false,
        permissionTables: mergedPermissionTables,
        permissionTablesWithNewRowFilterValues,
      });

      const now = new Date();
      const permission_groups: UserPermissionGroup[] = [
        ...uneditedUserData.permission_groups.filter(
          (prevGroup) => !deletedPermissionGroups.some((deletedPermissionGroup) => deletedPermissionGroup.equals(prevGroup.id)),
        ),
        ...newPermissionGroups.map<UserPermissionGroup>((permissionGroup) => ({
          id: permissionGroup._id,
          given_by: loggedUser.userId,
          registration_date: now,
        })),
      ];

      const updatedPermissionTables = this.addAuditMetaDataUserPermissionTables(
        loggedUser.userId,
        now,
        userPermissionTables,
        uneditedUserData.permission_tables,
      );

      const finalDomainsDiff = getDomainsDiffServer(uneditedUserData.domains, finalDomains, {
        splitClassifications: true,
        returnDeletedClassifications: true,
      });

      const updatedDomains = this.addAuditMetaDataUserDomains(
        finalDomains,
        uneditedUserData.domains,
        finalDomainsDiff,
        loggedUser.userId,
        now,
      );

      const updateData: Partial<MongooseUser> = {
        attributes: updatedAttributes,
        domains: updatedDomains,
        permission_tables: updatedPermissionTables,
        permission_groups,
      };

      if (editData.is_read_all !== undefined) {
        updateData.catalogs = new Map([
          ...Object.entries(uneditedUserData.catalogs),
          [DATALAKE_CATALOG_NAME, { ...uneditedUserData.catalogs.datalake, read_all: editData.is_read_all }],
        ]);
      }

      await this.userModel.updateOne(
        { _id: id },
        {
          $set: updateData,
        },
      );

      this.invalidateUsersDictCache();

      const permissionTablesDiff = getPermissionTablesDiffServer(uneditedUserData.permission_tables, updatedPermissionTables);
      const attributesDiff = getUserAttributesDiff({
        newUserAttributes: updatedAttributes,
        currUserAttributes: uneditedUserData.attributes,
      });

      this.auditingService.insertUserAudits({
        actorUserId: loggedUser.userId,
        operation: OP.Update,
        resource_id: id,
        domainsDiff: finalDomainsDiff,
        permissionTablesDiff,
        userAttributesDiff: attributesDiff,
        permissionGroupDiff: { newPermissionGroups, deletedPermissionGroups },
      });

      const updatedUser = await this.getFullDataUserById({ _id: uneditedUserData._id }, hasUniquePopulationsAuthz);

      return { user: updatedUser, lockedDomains, lockedPermissionTables };
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: loggedUser.userId,
        operation: OP.Update,
        resource: Resource.User,
        status: "error",
        resource_info: {
          id: id.toString(),
          name: AUDITING_UNKNOWN,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw new InternalServerErrorException(`Failed to edit user: ${id}`, { cause: error });
    }
  }

  async validateUniquePopulationOptions(uniquePopulations: number[]) {
    if (uniquePopulations.length === 0) return;

    const options = await this.getUniquePopulationOptions();
    const optionValues = new Set(options.map(({ id }) => id));
    const invalidUniquePopulationValue = uniquePopulations.find((id) => !optionValues.has(id));

    if (invalidUniquePopulationValue !== undefined) {
      throw new BadRequestException(`Invalid unique population value: ${invalidUniquePopulationValue}`);
    }
  }

  /**
   * @throws {ForbiddenException}
   */
  async assertHasPermissionsForSimpleAttributes(
    loggedUserId: UserID,
    newAttributes: Pick<CreateUserDtoAttributes, "mask" | "deceased_population">,
    newUserDomains: CreateUserDtoDomain[],
    prevAttributes?: Pick<UserAttributes, "mask" | "deceased_population">,
  ): Promise<void> {
    const didSetDeceasedPopulations = prevAttributes
      ? newAttributes.deceased_population !== prevAttributes.deceased_population
      : newAttributes.deceased_population === true;

    if (didSetDeceasedPopulations) {
      const hasPermissionsForDeceasedPopulations = await this.hasPermissionsForDeceasedPopulations(
        loggedUserId,
        newUserDomains.map((domain) => domain.id.toString()),
      );

      if (!hasPermissionsForDeceasedPopulations) {
        throw new ForbiddenException(`${loggedUserId} has no permission to set deceased population`);
      }
    }

    const didSetMask = prevAttributes ? newAttributes.mask !== prevAttributes.mask : newAttributes.mask === false;

    if (didSetMask) {
      const hasPermissionsForMask = await this.hasPermissionsForMask(
        loggedUserId,
        newUserDomains.map((domain) => domain.id.toString()),
      );

      if (!hasPermissionsForMask) {
        throw new ForbiddenException(`${loggedUserId} has no permission to set user mask`);
      }
    }
  }

  async hasPermissionsForUniquePopulations(userId: UserID): Promise<boolean> {
    const { allowed } = await this.openFgaService.check({
      user: formatFGAObjectId({ type: "user", id: userId }),
      relation: "can_manage_unique_population_indications",
      object: PLATFORM_FGA_INSTANCE,
    });

    return allowed;
  }

  async hasPermissionsForDeceasedPopulations(userId: UserID, domainIds: string[]): Promise<boolean> {
    const checksDeceasedIndications: ClientBatchCheckItem[] = [];
    domainIds.forEach((domainId) => {
      checksDeceasedIndications.push({
        user: formatFGAObjectId({ type: "user", id: userId }),
        relation: "can_manage_user_deceased_indications",
        object: formatFGAObjectId({ type: "domain", id: domainId }),
      });
    });

    const { result: resultDeceasedIndications } = await this.openFgaService.batchCheck({ checks: checksDeceasedIndications });

    return resultDeceasedIndications.every((res) => res.allowed);
  }

  async hasPermissionsForMask(userId: UserID, domainIds: string[]): Promise<boolean> {
    const checksMask: ClientBatchCheckItem[] = [];
    domainIds.forEach((domainId) => {
      checksMask.push({
        user: formatFGAObjectId({ type: "user", id: userId }),
        relation: "can_manage_user_mask_indications",
        object: formatFGAObjectId({ type: "domain", id: domainId }),
      });
    });

    const { result: resultMask } = await this.openFgaService.batchCheck({ checks: checksMask });

    return resultMask.every((res) => res.allowed);
  }

  private async splitDomainsByUpdatability(
    editUserDomains: ZEditUserDto["domains"],
    uneditedUserDomains: UserDomain[],
    domainsDiff: DomainDiffServer[],
    loggedUserId: LoggedUser["userId"],
  ): Promise<{ finalDomains: ZEditUserDto["domains"]; lockedDomains: LockedDomain[] }> {
    const isApiUser = await this.openFgaService.isApiUser(loggedUserId);

    if (!isApiUser) {
      return { finalDomains: editUserDomains, lockedDomains: [] };
    }

    const finalDomains: ZEditUserDto["domains"] = [];
    const lockedDomains: LockedDomain[] = [];

    await Promise.all(
      editUserDomains.map(async (domain) => {
        const domainDiff = domainsDiff.find(({ id }) => domain.id.equals(id));

        if (
          !!domainDiff &&
          domainDiff.diffType === "updated" &&
          !!domainDiff.last_changed_by &&
          !(await this.openFgaService.isApiUser(domainDiff.last_changed_by))
        ) {
          lockedDomains.push({ id: domainDiff.id, classifications: domainDiff.classifications, operation: "update" });
          const uneditedUserDomain = uneditedUserDomains!.find(({ id }) => id.equals(domain.id));
          finalDomains.push({ id: uneditedUserDomain.id, classifications: uneditedUserDomain.classifications });
        } else {
          finalDomains.push(domain);
        }
      }),
    );

    await Promise.all(
      domainsDiff.map(async (domainDiff) => {
        if (
          domainDiff.diffType === "deleted" &&
          !!domainDiff.last_changed_by &&
          !(await this.openFgaService.isApiUser(domainDiff.last_changed_by))
        ) {
          lockedDomains.push({ id: domainDiff.id, classifications: domainDiff.classifications, operation: "delete" });
          const uneditedUserDomain = uneditedUserDomains!.find(({ id }) => id.equals(domainDiff.id));
          finalDomains.push({ id: uneditedUserDomain.id, classifications: uneditedUserDomain.classifications });
        }
      }),
    );

    return { finalDomains, lockedDomains };
  }

  private async splitPermissionTablesByUpdatability(
    permissionTables: ZEditUserDto["permission_tables"],
    uneditedUserPermissionTables: UserPermissionTable[],
    loggedUserId: LoggedUser["userId"],
  ): Promise<{ finalPermisssionTables: ZEditUserDto["permission_tables"]; lockedPermissionTables: ZEditUserDto["permission_tables"] }> {
    if (!(await this.openFgaService.isApiUser(loggedUserId))) {
      return { finalPermisssionTables: permissionTables, lockedPermissionTables: [] };
    }

    const finalPermisssionTables: ZEditUserDto["permission_tables"] = [];
    const lockedPermissionTables: ZEditUserDto["permission_tables"] = [];

    await Promise.all(
      permissionTables.map(async (permissionTable) => {
        const uneditedPermissionTable = uneditedUserPermissionTables.find(({ id }) => id.equals(permissionTable.id));

        if (
          !uneditedPermissionTable ||
          !uneditedPermissionTable.last_changed_by ||
          (await this.openFgaService.isApiUser(userIdSchema.parse(uneditedPermissionTable.last_changed_by)))
        ) {
          finalPermisssionTables.push(permissionTable);
          return;
        }
        const isPermissionTableChanged = this.isUserPermissionTableChanged(uneditedPermissionTable, permissionTable);

        if (isPermissionTableChanged) {
          finalPermisssionTables.push({
            id: uneditedPermissionTable.id,
            row_filters: uneditedPermissionTable.row_filters.map((row_filter) => ({
              ...row_filter,
              values: row_filter.values.map(({ value }) => value),
            })),
          });
          lockedPermissionTables.push(permissionTable);
        } else {
          finalPermisssionTables.push(permissionTable);
        }
      }),
    );

    return { finalPermisssionTables, lockedPermissionTables };
  }

  /**
   * @throws {ForbiddenException}
   */
  async checkPermissionForDomains(
    userId: LoggedUser["userId"],
    domains: CreateUserDtoDomain[] | { id: string; classifications: string[] }[],
    options: { throw: true; message: (domainId: string) => string } | { throw: false } = { throw: false },
  ): Promise<{ resultDomains: ClientBatchCheckSingleResponse[]; resultClassifications: ClientBatchCheckSingleResponse[] }> {
    const checksDomains: ClientBatchCheckItem[] = [];
    domains.forEach(async (domain) => {
      checksDomains.push({
        user: formatFGAObjectId({ type: "user", id: userId }),
        relation: FGADomainRelationConstants.can_manage_data_permissions,
        object: formatFGAObjectId({
          type: "domain",
          id: domain.id.toString(),
        }),
      });
    });

    const { result: resultDomains } = await this.openFgaService.batchCheck({ checks: checksDomains });
    const notAllowedDomains = resultDomains.reduce<Set<string>>((acc, domain) => {
      if (!domain.allowed) {
        const domainId = parseFGAObjectId(domain.request.object)?.id;

        if (domainId) {
          acc.add(domainId);
          if (options.throw) {
            throw new ForbiddenException(options.message(domainId));
          }
        }
      }

      return acc;
    }, new Set());

    const domainsAllowed = domains.filter((domain) => !notAllowedDomains.has(domain.id.toString()));
    const checksDomainsClassification: ClientBatchCheckItem[] = [];

    for (const domain of domainsAllowed) {
      for (const classification of domain.classifications) {
        checksDomainsClassification.push({
          user: formatFGAObjectId({ type: "user", id: userId }),
          relation: "can_assign_to_user",
          object: formatFGAObjectId({
            type: "domain_classification",
            id: OpenFgaService.formatDomainClassification(domain.id, classification),
          }),
        });
      }
    }

    const { result: resultClassifications } = await this.openFgaService.batchCheck({ checks: checksDomainsClassification });

    if (options.throw) {
      resultClassifications.forEach((result) => {
        if (!result.allowed) {
          const payload = OpenFgaService.extractDomainClassification(result.request.object);

          if (payload) {
            throw new ForbiddenException(options.message(payload.domain));
          }
        }
      });
    }

    return { resultDomains, resultClassifications };
  }

  assertUserPermissionTablesValid(permissionTables: PopulatedUserPermissionTable[]) {
    permissionTables.forEach((permissionTable) => {
      permissionTable.row_filters.forEach((row_filter) => {
        if (row_filter.type === BOOLEAN_TYPE && row_filter.values.length !== 1) {
          throw new BadRequestException(`
           Row filter ${row_filter.kod} for permissions table ${permissionTable.id}
           is invalid: boolean row filter types must have exactly one value
          `);
        }
      });
    });
  }

  populatePermissionTables(
    inputPermissionTables: ZCreateUserDto["permission_tables"] | ZEditUserDto["permission_tables"],
    permissionTables: HydratedDocument<PermissionTable>[],
  ): PopulatedUserPermissionTable[] {
    return inputPermissionTables.map((permissionTable) => {
      const fullPermissionTable = permissionTables.find(({ _id }) => _id.equals(permissionTable.id))?.toObject();

      if (!fullPermissionTable) {
        throw new BadRequestException(`Could not find Permissions table ${permissionTable.id} in mongo`);
      }

      return {
        id: permissionTable.id,
        row_filters: permissionTable.row_filters.map((row_filter) => {
          const fullRowFilter = fullPermissionTable.row_filters.find(({ kod }) => kod === row_filter.kod);

          if (!fullRowFilter) {
            throw new BadRequestException(
              `Could not find Row filter ${row_filter.kod} for Permissions table ${permissionTable.id} in mongo`,
            );
          }

          return {
            ...row_filter,
            ...fullRowFilter,
          };
        }),
      };
    });
  }

  /**
   * @throws {BadRequestException}
   */
  mergePermissionTables(
    permissionTables: PopulatedUserPermissionTable[],
    uneditedPermissionTables: MongooseUser["permission_tables"],
  ): MergedPermissionTable[] {
    const finalPermisssionTables: MergedPermissionTable[] = [];

    for (const permissionTable of permissionTables) {
      const uneditedPermissionTable = uneditedPermissionTables.find(({ id }) => id.equals(permissionTable.id));

      if (!uneditedPermissionTable) {
        finalPermisssionTables.push({
          ...permissionTable,
          row_filters: permissionTable.row_filters.map((row_filter) => ({
            ...row_filter,
            values: row_filter.values.map((value) => ({ value, display_name: null, isNew: true })),
          })),
        });

        continue;
      }

      const mergedRowFilters: MergedPermissionTable["row_filters"] = [];

      for (const row_filter of permissionTable.row_filters) {
        const uneditedRowFilter = uneditedPermissionTable.row_filters.find(({ kod }) => kod === row_filter.kod);

        if (!uneditedRowFilter) {
          mergedRowFilters.push({
            ...row_filter,
            values: row_filter.values.map((value) => ({ value, display_name: null, isNew: true })),
          });

          continue;
        }

        const uneditedRowFilterValueDisplayNamesMap = new Map(
          uneditedRowFilter.values.map(({ value, display_name }) => [value, display_name]),
        );

        const mergedRowFilter: MergedPermissionTable["row_filters"][number] = {
          ...row_filter,
          values: row_filter.values.map((value) => {
            const display_name = uneditedRowFilterValueDisplayNamesMap.get(value);

            return {
              value,
              display_name: display_name ?? null,
              isNew: !display_name,
            };
          }),
        };

        mergedRowFilters.push(mergedRowFilter);
      }

      finalPermisssionTables.push({
        ...permissionTable,
        row_filters: mergedRowFilters,
      });
    }

    return finalPermisssionTables;
  }

  private isUserPermissionTableChanged(
    uneditedPermissionTable: Pick<UserPermissionTable, "row_filters" | "id">,
    editedPermissionTable: Pick<UserPermissionTable, "row_filters" | "id"> | ZEditUserDto["permission_tables"][number],
  ): boolean {
    return uneditedPermissionTable.row_filters.some((uneditedRowFilter) => {
      const editedRowFitler = editedPermissionTable.row_filters.find(({ kod }) => uneditedRowFilter.kod === kod);

      if (!editedRowFitler) {
        throw new BadRequestException(
          `request missing row filter with kod ${uneditedRowFilter.kod} for permission table with id ${uneditedPermissionTable.id}`,
        );
      }

      return (
        uneditedRowFilter.values.length !== editedRowFitler.values.length ||
        uneditedRowFilter.values.some(
          (uneditedValue) =>
            !editedRowFitler.values.some((item: UserRowFilterValue | string | number) =>
              typeof item === "object" ? item.value === uneditedValue.value : item === uneditedValue.value,
            ),
        )
      );
    });
  }

  async mergeRowFilterValuesWithTrinoValues(
    args:
      | { isCreate: false; permissionTables: MergedPermissionTable[]; permissionTablesWithNewRowFilterValues: MergedPermissionTable[] }
      | { isCreate: true; permissionTables: PopulatedUserPermissionTable[] },
  ): Promise<UserPermissionTable[]> {
    const userPermissionTables: UserPermissionTable[] = [];
    const rowFiltersValuesByDimensionsTable = await this.permissionTableService.getRowFilterValuesByDimensionsTable(
      args.isCreate === true ? args.permissionTables : args.permissionTablesWithNewRowFilterValues,
    );

    args.permissionTables.forEach((permissionTable: (typeof args.permissionTables)[number]) => {
      const userPermissionTable: UserPermissionTable = {
        id: permissionTable.id,
        row_filters: [],
      };
      permissionTable.row_filters.forEach((rowFilter: (typeof permissionTable.row_filters)[number], rowFilterIndex: number) => {
        userPermissionTable.row_filters.push({
          kod: rowFilter.kod,
          values: [],
        });
        const rowFilterValueOptions = rowFiltersValuesByDimensionsTable[rowFilter.dimensions_table];
        const rowFilterValuesByValue = new Map(
          rowFilterValueOptions?.map((rowFilterValueOption) => [rowFilterValueOption.value, rowFilterValueOption]) ?? [],
        );
        rowFilter.values.forEach((value: (typeof rowFilter.values)[number]) => {
          const valueOption = rowFilterValuesByValue.get(typeof value === "object" ? value.value : value);

          if (!valueOption && (args.isCreate || (typeof value === "object" && value.isNew))) {
            throw new NotFoundException(
              `Could not find row filter value ${value}
                in dimensions_table ${rowFilter.dimensions_table}
                for row filter with kod ${rowFilter.kod}
                in permission table with id ${permissionTable.id}`,
            );
          }

          userPermissionTable.row_filters[rowFilterIndex].values.push({
            value: typeof value === "object" ? value.value : value,
            display_name: typeof value === "object" && !value.isNew ? value.display_name : valueOption.display_name,
          });
        });
      });

      userPermissionTables.push(userPermissionTable);
    });

    return userPermissionTables;
  }

  addAuditMetaDataUserPermissionTables(
    loggedUserId: LoggedUser["userId"],
    now: Date,
    userPermissionTables: UserPermissionTable[],
    uneditedUserPermissionTables?: UserPermissionTable[],
  ) {
    return userPermissionTables.map((userPermissionTable) => {
      const uneditedUserPermissionTable = uneditedUserPermissionTables?.find(({ id }) => id.equals(userPermissionTable.id));
      let permissionTableMetaData: Pick<UserPermissionTable, "given_by" | "create_date" | "last_changed_by" | "last_change"> = {};

      if (uneditedUserPermissionTable) {
        const isPermissionTableChanged = this.isUserPermissionTableChanged(uneditedUserPermissionTable, userPermissionTable);

        permissionTableMetaData = {
          create_date: uneditedUserPermissionTable.create_date,
          given_by: uneditedUserPermissionTable.given_by,
          last_change: isPermissionTableChanged ? now : uneditedUserPermissionTable.last_change,
          last_changed_by: isPermissionTableChanged ? loggedUserId : uneditedUserPermissionTable.last_changed_by,
        };
      } else {
        permissionTableMetaData = {
          create_date: now,
          given_by: loggedUserId,
          last_change: now,
          last_changed_by: loggedUserId,
        };
      }

      return { ...userPermissionTable, ...permissionTableMetaData };
    });
  }

  addAuditMetaDataUserDomains(
    finalDomains: ZEditUserDto["domains"],
    uneditedDomains: MongooseUserDomain[],
    domainsDiff: SplitedDomainDiffServer[],
    loggedUserId: UserID,
    now: Date,
  ): MongooseUserDomain[] {
    const updatedDomains: MongooseUserDomain[] = finalDomains.map((finalDomain) => {
      const domainDiff = domainsDiff.find(({ id }) => finalDomain.id.equals(id));
      const findUneditedDomain = () => uneditedDomains.find(({ id }) => finalDomain.id.equals(id));

      let domainMetaData: Pick<MongooseUserDomain, "create_date" | "given_by" | "last_change" | "last_changed_by"> = {};

      if (domainDiff) {
        if (domainDiff.diffType === "new") {
          domainMetaData = {
            create_date: now,
            given_by: loggedUserId,
            last_change: now,
            last_changed_by: loggedUserId,
          };
        } else if (domainDiff.diffType === "updated") {
          const uneditedUserDomain = findUneditedDomain();

          domainMetaData = {
            create_date: uneditedUserDomain?.create_date,
            given_by: uneditedUserDomain?.given_by,
            last_change: now,
            last_changed_by: loggedUserId,
          };
        }
      } else {
        const uneditedUserDomain = findUneditedDomain();

        domainMetaData = {
          create_date: uneditedUserDomain?.create_date,
          given_by: uneditedUserDomain?.given_by,
          last_change: uneditedUserDomain?.last_change,
          last_changed_by: uneditedUserDomain?.last_changed_by,
        };
      }

      const updatedDomain: MongooseUserDomain = {
        ...finalDomain,
        ...domainMetaData,
      };

      return updatedDomain;
    });

    return updatedDomains;
  }

  async getUserCatalogsByUserId(userId: UserID): Promise<User["catalogs"]> {
    const user = await this.getUserById({ user_id: userId }, ["catalogs"]);

    return user.catalogs;
  }

  /**
   * @audits
   * @throws {NotFoundException}
   */
  async addUserCatalogsByUserId(
    loggedUserId: UserID,
    userId: User["user_id"],
    newCatalogsNames: AddUserCatalogsDto["catalogs"],
  ): Promise<User["catalogs"]> {
    let auditingUserFullName = AUDITING_UNKNOWN;

    try {
      const user = await this.getUserById({ user_id: userId }, ["catalogs", "first_name", "last_name"]);
      auditingUserFullName = toFullName(user, AUDITING_UNKNOWN);
      const updatedCatalogs = newCatalogsNames.reduce<User["catalogs"]>(
        (acc, catalog) => {
          acc[catalog] = {};

          return acc;
        },
        { ...user.catalogs },
      );

      updatedCatalogs[DATALAKE_CATALOG_NAME] = user.catalogs[DATALAKE_CATALOG_NAME];

      const updateData = {
        catalogs: updatedCatalogs,
      } satisfies Partial<User>;

      await this.usersCollection.updateOne(
        { user_id: userId },
        {
          $set: updateData,
        },
      );

      this.invalidateUsersDictCache();

      this.auditingService.insertLegacyAudit({
        user_id: loggedUserId,
        operation: OP.Update,
        resource: Resource.User,
        status: "success",
        resource_info: {
          id: userId,
          name: AUDITING_UNKNOWN,
        },
        message: "Updated User",
        difference: customDiff(
          {
            catalogs: user.catalogs,
          } satisfies typeof updateData,
          updateData,
          false,
        ),
      });

      return updatedCatalogs;
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: loggedUserId,
        operation: OP.Update,
        resource: Resource.User,
        status: "error",
        resource_info: {
          id: userId,
          name: auditingUserFullName,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw error;
    }
  }

  /**
   * @audits
   * @throws {NotFoundException}
   */
  async editUserCatalogsByUserId(
    loggedUserId: UserID,
    userId: User["user_id"],
    editedCatalogs: EditUserCatalogsDto["catalogs"],
  ): Promise<User["catalogs"]> {
    let auditingUserFullName = AUDITING_UNKNOWN;

    try {
      const user = await this.getUserById({ user_id: userId }, ["catalogs", "first_name", "last_name"]);
      auditingUserFullName = toFullName(user, AUDITING_UNKNOWN);
      const editedCatalogsMap = new Map(editedCatalogs.map(({ oldCatalogName, newCatalogName }) => [oldCatalogName, newCatalogName]));

      const updatedCatalogs = Object.keys(user.catalogs).reduce<User["catalogs"]>((acc, currCatalogName) => {
        const newCatalogName = editedCatalogsMap.get(currCatalogName);

        if (newCatalogName) {
          acc[newCatalogName] = {};
        } else {
          acc[currCatalogName] = {};
        }

        return acc;
      }, {});

      updatedCatalogs[DATALAKE_CATALOG_NAME] = user.catalogs[DATALAKE_CATALOG_NAME];

      const updateData = {
        catalogs: updatedCatalogs,
      } satisfies Partial<User>;

      await this.usersCollection.updateOne(
        { user_id: userId },
        {
          $set: updateData,
        },
      );

      this.invalidateUsersDictCache();

      this.auditingService.insertLegacyAudit({
        user_id: loggedUserId,
        operation: OP.Update,
        resource: Resource.User,
        status: "success",
        resource_info: {
          id: userId,
          name: auditingUserFullName,
        },
        message: "Updated User",
        difference: customDiff(
          {
            catalogs: user.catalogs,
          } satisfies typeof updateData,
          updateData,
          false,
        ),
      });

      return updatedCatalogs;
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: loggedUserId,
        operation: OP.Update,
        resource: Resource.User,
        status: "error",
        resource_info: {
          id: userId,
          name: AUDITING_UNKNOWN,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw error;
    }
  }

  /**
   * @audits
   * @throws {NotFoundException}
   */
  async deleteUserCatalogsByUserId(
    loggedUserId: UserID,
    userId: User["user_id"],
    catalogNamesToDelete: DeleteUserCatalogsDto["catalogs"],
  ): Promise<User["catalogs"]> {
    let auditingUserFullName = AUDITING_UNKNOWN;

    try {
      const user = await this.getUserById({ user_id: userId }, ["catalogs", "first_name", "last_name"]);
      auditingUserFullName = toFullName(user, AUDITING_UNKNOWN);

      const catalogNamesToDeleteSet = new Set(catalogNamesToDelete);
      const updatedCatalogs = Object.keys(user.catalogs).reduce<User["catalogs"]>((acc, currCatalogName) => {
        if (!catalogNamesToDeleteSet.has(currCatalogName)) {
          acc[currCatalogName] = {};
        }

        return acc;
      }, {});

      updatedCatalogs[DATALAKE_CATALOG_NAME] = user.catalogs[DATALAKE_CATALOG_NAME];

      const updateData = {
        catalogs: updatedCatalogs,
      } satisfies Partial<User>;

      await this.usersCollection.updateOne(
        { user_id: userId },
        {
          $set: updateData,
        },
      );

      this.invalidateUsersDictCache();

      this.auditingService.insertLegacyAudit({
        user_id: loggedUserId,
        operation: OP.Update,
        resource: Resource.User,
        status: "success",
        resource_info: {
          id: userId,
          name: auditingUserFullName,
        },
        message: "Updated User",
        difference: customDiff(
          {
            catalogs: user.catalogs,
          } satisfies typeof updateData,
          updateData,
          false,
        ),
      });

      return updatedCatalogs;
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: loggedUserId,
        operation: OP.Update,
        resource: Resource.User,
        status: "error",
        resource_info: {
          id: userId,
          name: AUDITING_UNKNOWN,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw error;
    }
  }

  async refreshSapPermittedUsers() {
    const currentUsersInMongo = await this.getSapPermittedUsers();
    const currentUsersInMongoMap = {};
    currentUsersInMongo.forEach(({ user_id }) => {
      currentUsersInMongoMap[user_id] = true;
    });

    // BLACKEND - table name
    const query = `
    SELECT DISTINCT LOWER(user_id) AS user_id
    FROM mock_sap_users
  `;
    const usersInTrino = await this.trinoService.query<{ user_id: string }>(query);
    const usersInTrinoMap = {};
    usersInTrino.forEach(({ user_id }) => {
      usersInTrinoMap[user_id] = true;
    });

    const usersToRemove = currentUsersInMongo.filter(({ user_id }) => !usersInTrinoMap[user_id]).map(({ user_id }) => user_id);
    const usersToAdd = usersInTrino.filter(({ user_id }) => !currentUsersInMongoMap[user_id]).map(({ user_id }) => user_id);

    await Promise.all([this.removeSapPermittedUsers(usersToRemove), this.addSapPermittedUsers(usersToAdd)]);

    return { added: usersToAdd.length, removed: usersToRemove.length };
  }

  private async getSapPermittedUsers() {
    return await this.sapPermittedUsersModel.find({}, { user_id: true });
  }

  private async addSapPermittedUsers(userIds: string[]) {
    await this.sapPermittedUsersModel.create(userIds.map((user_id) => ({ user_id })));
  }

  private async removeSapPermittedUsers(userIds: string[]) {
    await this.sapPermittedUsersModel.deleteMany({ user_id: { $in: userIds } });
  }

  async getUniquePopulationOptions(): Promise<UniquePopulationOption[]> {
    const cachedOptions = await this.ioredis.get(REDIS_KEYS.UNIQUE_POPULATION_OPTIONS);

    if (cachedOptions) {
      return JSON.parse(cachedOptions) as UniquePopulationOption[];
    }

    const originalOptions = await this.trinoService.query<UniquePopulationOption>(
      `SELECT id, name FROM ${process.env.UNIQUE_POPULATION_OPTIONS_TABLE}`,
    );

    this.ioredis.set(REDIS_KEYS.UNIQUE_POPULATION_OPTIONS, JSON.stringify(originalOptions), "EX", 60 * 60);

    return originalOptions;
  }

  private async getUserDataPermissionsByUserId(userId: UserID, type: "full"): ReturnType<typeof this.opaApi.getUserLivePermissions>;
  private async getUserDataPermissionsByUserId(
    userId: UserID,
    type: "table",
    table: StandardTable,
  ): ReturnType<typeof this.opaApi.getUserPermissionsByTableAndUser>;
  private async getUserDataPermissionsByUserId(userId: UserID, type: "full" | "table", table?: StandardTable) {
    const [mongoUser] = await this.userModel
      .aggregate<
        Pick<MongooseUser, "user_id" | "domains"> &
          Pick<User, "catalogs"> & {
            permission_groups: Pick<PermissionGroup, "domains">[];
          }
      >([
        {
          $match: {
            user_id: userId,
            "catalogs.datalake": { $exists: true },
            "attributes.blocked": {
              $ne: true,
            },
          },
        },
        {
          $lookup: {
            from: "permission_groups",
            localField: "permission_groups.id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: false,
                  domains: true,
                },
              },
            ],
            as: "permission_groups",
          },
        },
        {
          $project: {
            _id: false,
            user_id: true,
            domains: true,
            permission_groups: true,
            catalogs: true,
          },
        },
      ])
      .exec();

    if (!mongoUser) {
      throw new NotFoundException(`User not found with id ${userId}`);
    }

    const mergedCurrDomains = this.toUserDomainsDict(mongoUser);
    const payload: GetDictUserPreviewSchemaDto = {
      user_id: userIdSchema.parse(mongoUser.user_id),
      catalogs: mongoUser.catalogs,
      domains: mergedCurrDomains,
    };

    return type === "full" ? this.opaApi.getUserLivePermissions(payload) : this.opaApi.getUserPermissionsByTableAndUser(table, payload);
  }

  async getLiveTablesByUser(userId: UserID, { type, data }: ZGetUserPreviewDto): Promise<ZTablePreviewDto[]> {
    const tablesProj = [
      "_id",
      "columns_dict",
      "table_name",
      "schema_name",
      "catalog_name",
      "attributes",
      "table_display_name",
      "application",
      "source_type",
    ] as const satisfies (keyof WithId<MongooseTable>)[];

    if (type === "current") {
      const opaTables = await this.getUserDataPermissionsByUserId(userId, "full");
      const opaTablesMap = new Map(opaTables.map((table) => [formatRawStandardTable(table), { ...table }]));
      const tables = await this.tableService.getTablesByTableFullNames([...opaTablesMap.keys()], tablesProj);

      return tables.map((table) => {
        const opaTable = opaTablesMap.get(formatRawStandardTable({ tableName: table.table_name, tableSchema: table.schema_name }))!;
        const opaCount =
          table.source_type?.toLowerCase() === SAP_SOURCE_TYPE
            ? opaTable.columns.filter((column) => column !== SAP_INTERNAL_COLUMN_NAME).length
            : opaTable.columns.length;
        const shieldCount = Object.keys(table.columns_dict ?? {}).length;

        return {
          ...table,
          permission_source: { source: opaTable.permission_source },
          opaCount,
          shieldCount,
        };
      });
    } else if (type === "new" && data) {
      const domains = this.toUserDomainsDict(data);
      const opaTables = await this.opaApi.getUserLivePermissions({
        user_id: userId,
        catalogs: {
          [DATALAKE_CATALOG_NAME]: {
            ...DEFAULT_USER_CATALOGS.datalake,
            read_all: data.is_read_all,
          },
        },
        domains,
      });
      const opaTablesMap = new Map(opaTables.map((table) => [formatRawStandardTable(table), { ...table }]));
      const tables = await this.tableService.getTablesByTableFullNames([...opaTablesMap.keys()], tablesProj);

      return tables.map((table) => {
        const opaTable = opaTablesMap.get(formatRawStandardTable({ tableName: table.table_name, tableSchema: table.schema_name }))!;
        const opaCount =
          table.source_type?.toLowerCase() === SAP_SOURCE_TYPE
            ? opaTable.columns.filter((column) => column !== SAP_INTERNAL_COLUMN_NAME).length
            : opaTable.columns.length;
        const shieldCount = Object.keys(table.columns_dict ?? {}).length;

        return {
          ...table,
          permission_source: { source: opaTable.permission_source },
          opaCount,
          shieldCount,
          haveNewColumns: true,
        };
      });
    } else {
      const domains = this.toUserDomainsDict(data);
      const [opaNewTables, opaCurrTables] = await Promise.all([
        this.opaApi.getUserLivePermissions({
          user_id: userId,
          catalogs: {
            [DATALAKE_CATALOG_NAME]: {
              ...DEFAULT_USER_CATALOGS.datalake,
              read_all: data.is_read_all,
            },
          },
          domains,
        }),
        this.getUserDataPermissionsByUserId(userId, "full"),
      ]);

      const opaNewTablesMap = new Map(opaNewTables.map((table) => [formatRawStandardTable(table), { ...table }]));
      const opaCurrTablesMap = new Map(opaCurrTables.map((table) => [formatRawStandardTable(table), { ...table }]));
      const tables = await this.tableService.getTablesByTableFullNames(
        new Set([...opaCurrTablesMap.keys(), ...opaNewTablesMap.keys()]),
        tablesProj,
      );

      return tables.map((table) => {
        const newTable = opaNewTablesMap.get(formatRawStandardTable({ tableName: table.table_name, tableSchema: table.schema_name }));
        const currTable = opaCurrTablesMap.get(formatRawStandardTable({ tableName: table.table_name, tableSchema: table.schema_name }));
        const setCurrColumns = new Set(currTable?.columns);
        const setLiveCurrColumns = new Set(newTable?.columns);
        const haveNewColumns = Boolean(!currTable || newTable?.columns.some((col) => !setCurrColumns.has(col)));
        const haveDeletedColumns = Boolean(!newTable || currTable?.columns.some((col) => !setLiveCurrColumns.has(col)));
        const opaCount =
          (table.source_type?.toLowerCase() === SAP_SOURCE_TYPE
            ? newTable?.columns.filter((column) => column !== SAP_INTERNAL_COLUMN_NAME).length
            : newTable?.columns.length) ?? 0;
        const shieldCount = Object.keys(table.columns_dict ?? {}).length;

        return {
          ...table,
          permission_source: { prevSource: currTable?.permission_source, source: newTable?.permission_source },
          opaCount,
          shieldCount,
          haveNewColumns,
          haveDeletedColumns,
        };
      });
    }
  }

  private filterTableColumns(table: MongooseTable, columns: ColumnWithStatus[]): ZGetTableColumnDictDto {
    const columnNamesSet = new Map(columns.map((col) => [col.column_name, { is_new: col.is_new, is_deleted: col.is_deleted }]));
    const filteredColumnsDict: ZGetTableColumnDictDto = {};

    //columns dict is record
    for (const col of Object.values(table.columns_dict)) {
      const status = columnNamesSet.get(col.column_name);

      if (!status) {
        continue;
      }

      const parsed_data_type = col.attributes.data_type?.split("(")[0].toUpperCase();

      filteredColumnsDict[col.column_name] = {
        column_name: col.column_name,
        attributes: {
          ...col.attributes,
          ...status,
          data_type: dbTypeMapping[parsed_data_type] ?? parsed_data_type,
        },
      };
    }

    return filteredColumnsDict;
  }

  async getLiveColumnsByTable(userId: UserID, table: StandardTable, { type, data }: ZGetUserPreviewDto): Promise<ZGetTableColumnDictDto> {
    const GET_TABLE_WITH_CLASSIFICATION_NAME = [
      {
        $match: {
          schema_name: table.tableSchema,
          table_name: table.tableName,
        },
      },
      {
        $addFields: {
          columns_array: {
            $objectToArray: "$columns_dict",
          },
        },
      },
      {
        $unwind: {
          path: "$columns_array",
        },
      },
      {
        $lookup: {
          from: "classifications",
          localField: "columns_array.v.attributes.classification",
          foreignField: "_id",
          as: "classification_info",
        },
      },
      {
        $addFields: {
          "columns_array.v.attributes.classification": {
            $ifNull: [
              {
                $arrayElemAt: ["$classification_info.name", 0],
              },
              "$columns_array.v.attributes.classification",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          new_columns: {
            $push: {
              k: "$columns_array.k",
              v: "$columns_array.v",
            },
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$root",
              {
                columns_dict: { $arrayToObject: "$new_columns" },
              },
            ],
          },
        },
      },
      {
        $project: {
          root: 0,
          new_columns: 0,
          classification_info: 0,
          columns_array: 0,
        },
      },
    ];

    const [mongooseTable] = await this.tableModel.aggregate<MongooseTable>(GET_TABLE_WITH_CLASSIFICATION_NAME).exec();

    if (!mongooseTable) {
      throw new BadRequestException(
        `Multiple tables found with the same schema name and table name: ${table.tableSchema} and ${table.tableName}`,
      );
    }

    let columnsWithStatus: ColumnWithStatus[] = [];

    if (type === "current") {
      const columns = await this.getUserDataPermissionsByUserId(userId, "table", table);
      columnsWithStatus = columns.map((col) => ({ column_name: col }));
    } else if (type === "new") {
      const domains = this.toUserDomainsDict(data);
      const columns = await this.opaApi.getUserPermissionsByTableAndUser(table, {
        user_id: userId,
        catalogs: {
          [DATALAKE_CATALOG_NAME]: {
            ...DEFAULT_USER_CATALOGS.datalake,
            read_all: data.is_read_all,
          },
        },
        domains: domains,
      });

      columnsWithStatus = columns.map((col) => ({ column_name: col, is_new: true }));
    } else {
      const domains = this.toUserDomainsDict(data);
      const [newColumns, currColumns] = await Promise.all([
        this.opaApi.getUserPermissionsByTableAndUser(table, {
          user_id: userId,
          catalogs: {
            [DATALAKE_CATALOG_NAME]: {
              ...DEFAULT_USER_CATALOGS.datalake,
              read_all: data.is_read_all,
            },
          },
          domains: domains,
        }),
        this.getUserDataPermissionsByUserId(userId, "table", table),
      ]);

      currColumns?.forEach((currCol) => {
        const is_deleted = !newColumns?.some((col) => currCol === col);

        if (is_deleted) {
          columnsWithStatus.push({
            column_name: currCol,
            is_deleted,
          });
        }
      });

      newColumns?.forEach((col) => {
        const is_new = !currColumns?.some((currCol) => col === currCol);

        columnsWithStatus.push({ column_name: col, is_new });
      });
    }

    return this.filterTableColumns(mongooseTable, columnsWithStatus);
  }
}
