import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserID, userIdSchema } from "@port/common-schemas";
import {
  ClientBatchCheckRequest,
  FGAClientCheckRequest,
  FGADomain_classificationRelationConstants,
  FGATupleKey,
  formatFGAObjectId,
  parseFGAObjectId,
  PLATFORM_FGA_INSTANCE,
} from "@port/openfga-client";
import { withRollbacks } from "@port/server-utils";
import {
  ApplicationUserDomain,
  ApplicationUserIndicationDiff,
  ApplicationUser as MongooseApplicationUser,
  Domain as MongooseDomain,
  Role as MongooseRole,
  OP,
} from "@port/shield-models";
import {
  ApplicationUserBooleanAttribute,
  applicationUserBooleanAttributes,
  isApplicationUserSet,
  NON_ADMIN_ROLE_NAMES,
  NonAdminRoleName,
  SHIELD_ROLE_NAME,
  SHIELD_ROLE_NAMES,
  ShieldRoleName,
} from "@port/shield-schemas";
import { chunk } from "lodash";
import { ObjectId, WithId } from "mongodb";
import { HydratedDocument, Model, PipelineStage } from "mongoose";
import AuditingService from "src/auditing/auditing.service";
import { LoggedUser } from "src/auth/auth.interface";
import { DomainsService } from "src/domains/domains.service";
import { KafkaService } from "src/kafka/kafka.service";
import { OpenFgaService } from "src/openfga/openfga.service";
import { RolesService } from "src/roles/roles.service";
import { GetUserInfoDto } from "src/user-info/user-info.interface";
import { UserInfoService } from "src/user-info/user-info.service";
import { toFullName } from "src/user-info/user-info.utils";
import { toMongoObjectId } from "src/utils/mongo.utils";
import {
  ZCreateApplicationUserDto,
  ZCreateApplicationUserReturnDto,
  ZDeleteApplicationUserDto,
  ZEditApplicationUserDto,
  ZEditApplicationUserReturnDto,
  ZGetApplicationUserDto,
  ZGetApplicationUserManagePermissionsDto,
  ZGetApplicationUserParams,
  ZGetApplicationUsersDto,
  ZGetLoggedUserInfoDto,
  ZGetLoggedUserPermissionsDisplayDto,
} from "./application_users.classes";
import {
  ApplicationUserData,
  DomainWithOwners,
  EditApplicationUserDomainDto,
  OpenFgaFormattedUser as FormattedOpenFgaUser,
  OpenFgaFormattedUser,
  OpenFgaFormattedUserDomain,
  OpenFgaFormattedUserDomainWithRoleIds,
} from "./application_users.interfaces";
import { booleanAttributeNameToCamelCase, booleanAttributeNameToSnakeCase, getApplicationUserDiff } from "./application_users.utils";

const APPLICATION_USER_DATA_PIPELINE = [
  // Add flag to determine if user has domains
  {
    $addFields: { hasNoDomains: { $eq: ["$domains", []] } },
  },
  {
    $unwind: {
      path: "$domains",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "domains",
      localField: "domains.id",
      foreignField: "_id",
      as: "domain_data",
    },
  },
  {
    $lookup: {
      from: "roles",
      localField: "domains.roles",
      foreignField: "_id",
      as: "domains.roles",
    },
  },
  {
    $addFields: {
      "domains.name": "$domain_data.name",
      "domains.display_name": "$domain_data.display_name",
      full_name: { $concat: ["$first_name", " ", "$last_name"] },
    },
  },

  {
    $group: {
      _id: "$_id",
      domains: { $push: "$domains" },
      userId: { $first: "$user_id" },
      hasNoDomains: { $first: "$hasNoDomains" },

      fullName: { $first: "$full_name" },
      createDate: { $first: "$create_date" },
      isAdmin: { $first: "$is_admin" },
      canCreateConnections: { $first: "$can_create_connections" },
      canManageUniquePopulationIndications: { $first: "$can_manage_unique_population_indications" },
    },
  },
  {
    $addFields: {
      domains: {
        $cond: {
          if: "$hasNoDomains",
          then: [],
          else: "$domains",
        },
      },
    },
  },
  {
    $unset: "hasNoDomains",
  },
] as const satisfies PipelineStage[];

@Injectable()
export class ApplicationUsersService {
  private readonly logger = new Logger(ApplicationUsersService.name);

  constructor(
    private readonly auditingService: AuditingService,
    private readonly userInfoService: UserInfoService,
    private readonly kafkaService: KafkaService,
    private readonly rolesService: RolesService,
    private readonly openFgaService: OpenFgaService,
    private readonly domainsService: DomainsService,
    @InjectModel(MongooseApplicationUser.name) private readonly applicationUserModel: Model<MongooseApplicationUser>,
  ) {}

  private formatApplicationUserDataToListDto(user: ApplicationUserData): ZGetApplicationUsersDto["applicationUsers"][number] {
    const rolesMapById = new Map<string, ZGetApplicationUsersDto["applicationUsers"][number]["roles"][number]>(
      user.domains.flatMap((domain) =>
        domain.roles.map((role) => [
          role._id.toString(),
          { name: role.name as NonAdminRoleName, displayName: role.display_name, color: role.color },
        ]),
      ),
    );

    return {
      userId: userIdSchema.parse(user.userId),
      fullName: user.fullName,
      createDate: user.createDate,
      isAdmin: user.isAdmin,
      roles: Array.from(rolesMapById.values()),
    };
  }

  async getApplicationUsers({
    page,
    size,
    sortField,
    sortDirection,
    search,
    actorId,
  }: ZGetApplicationUserParams): Promise<ZGetApplicationUsersDto> {
    const limit = size;
    const skip = (page - 1) * size;
    const loweredSearchTerm = search?.toString()?.toLowerCase();
    const { allowed: canManageAdmins } = await this.openFgaService.check({
      user: formatFGAObjectId({ type: "user", id: actorId }),
      relation: "can_manage_admins",
      object: PLATFORM_FGA_INSTANCE,
    });

    const filterPipeline: PipelineStage[] = loweredSearchTerm
      ? [
          {
            $match: {
              $and: [
                ...(canManageAdmins ? [] : [{ isAdmin: false }]),
                {
                  $or: [
                    { fullName: { $regex: loweredSearchTerm, $options: "i" } },
                    { userId: { $regex: loweredSearchTerm, $options: "i" } },
                    {
                      domains: {
                        $elemMatch: {
                          $or: [
                            { display_name: { $regex: loweredSearchTerm, $options: "i" } },
                            { name: { $regex: loweredSearchTerm, $options: "i" } },
                            {
                              roles: {
                                $elemMatch: {
                                  $or: [
                                    { name: { $regex: loweredSearchTerm, $options: "i" } },
                                    { display_name: { $regex: loweredSearchTerm, $options: "i" } },
                                  ],
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        ]
      : canManageAdmins
        ? []
        : [{ $match: { isAdmin: false } }];

    const paginationPipeline: PipelineStage[] = [
      {
        $sort: {
          [sortField]: sortDirection === "asc" ? 1 : -1,
        },
      },
      {
        $facet: {
          applicationUsers: [{ $skip: skip }, { $limit: limit }],
          metadata: [{ $count: "totalCount" }],
        },
      },
    ];

    const aggregation = [...APPLICATION_USER_DATA_PIPELINE, ...filterPipeline, ...paginationPipeline] as const satisfies PipelineStage[];

    const result = await this.applicationUserModel
      .aggregate<{
        applicationUsers: ApplicationUserData[];
        metadata: [{ totalCount: number }];
      }>(aggregation)
      .exec();

    // result will always have one item because we're using $facet
    const { applicationUsers, metadata } = result[0]!;

    const formattedApplicationUsers: ZGetApplicationUsersDto["applicationUsers"] = applicationUsers.map((user) =>
      this.formatApplicationUserDataToListDto(user),
    );

    const totalCount = metadata[0]?.totalCount ?? 0;

    return {
      totalCount,
      applicationUsers: formattedApplicationUsers,
    };
  }

  private async getApplicationUserDomainsRoles(
    user_id: UserID,
    relationType: "assigned" | "manage",
  ): Promise<Pick<OpenFgaFormattedUserDomain, "id" | "roleNames">[]> {
    const userDomainsRolesByDomainIdMap = new Map<string, Pick<OpenFgaFormattedUserDomain, "id" | "roleNames">>();

    await Promise.all(
      NON_ADMIN_ROLE_NAMES.map(async (roleName) => {
        const { objects: domainObjects } = await this.openFgaService.listObjects({
          user: formatFGAObjectId({ type: "user", id: user_id }),
          type: "domain",
          relation: relationType === "assigned" ? roleName : `can_manage_${roleName}s`,
        });

        domainObjects.forEach((domainObject) => {
          const domainId = parseFGAObjectId(domainObject)?.id;

          if (domainId) {
            const userDomainRoles = userDomainsRolesByDomainIdMap.get(domainId) ?? { id: domainId, roleNames: [] };

            userDomainsRolesByDomainIdMap.set(domainId, {
              id: toMongoObjectId(domainId),
              roleNames: [...userDomainRoles.roleNames, roleName],
            });
          } else {
            this.logger.warn(new Error(`Invalid domainObject ${domainObject}`));
          }
        });
      }),
    );

    return Array.from(userDomainsRolesByDomainIdMap.values());
  }

  private async getApplicationUserDomainClassifications(userId: UserID, relationType: "assigned" | "manage") {
    const userFgaObj = formatFGAObjectId({ type: "user", id: userId });

    const userDomainClassifications = await this.openFgaService.listObjects({
      user: userFgaObj,
      type: "domain_classification",
      relation: relationType === "assigned" ? "assigner" : "can_manage_assigners",
    });

    return this.openFgaService.getClassificationsByDomainID(userDomainClassifications.objects);
  }

  /**
   * @throws {NotFoundException}
   */
  private async getFormattedOpenFgaUser(userId: UserID): Promise<FormattedOpenFgaUser> {
    const [userDomainsRoles, userDomainClassifications, isAdmin, canCreateConnections, canManageUniquePopulationIndications] =
      await Promise.all([
        this.getApplicationUserDomainsRoles(userId, "assigned"),
        this.getApplicationUserDomainClassifications(userId, "assigned"),
        this.openFgaService.isAdmin(userId),
        this.openFgaService.read(this.openFgaService.generateCanCreateConnectionsTuple(userId)).then(({ tuples }) => tuples.length > 0),
        this.openFgaService
          .read(this.openFgaService.generateCanManageUniquePopulationIndicationsTuple(userId))
          .then(({ tuples }) => tuples.length > 0),
      ]);

    if (!isApplicationUserSet({ domains: userDomainsRoles, isAdmin, canCreateConnections, canManageUniquePopulationIndications })) {
      throw new NotFoundException(`User ${userId} not found in OpenFga`);
    }

    const user: FormattedOpenFgaUser = {
      userId: userIdSchema.parse(userId),
      domains: userDomainsRoles.map((domain) => ({
        id: domain.id,
        roleNames: domain.roleNames,
        classifications: userDomainClassifications[domain.id.toString()] ?? [],
      })),
      isAdmin,
      canCreateConnections,
      canManageUniquePopulationIndications,
    };

    return user;
  }

  /**
   * @throws {NotFoundException}
   */
  async getApplicationUserDto(userId: UserID): Promise<ZGetApplicationUserDto> {
    const [{ isAdmin, domains, canCreateConnections, canManageUniquePopulationIndications }, metadata] = await Promise.all([
      this.getFormattedOpenFgaUser(userId),
      this.applicationUserModel.findOne<Pick<MongooseApplicationUser, "first_name" | "last_name">>(
        { user_id: userId },
        { first_name: true, last_name: true },
      ),
    ]);

    const user: ZGetApplicationUserDto = {
      userId: userIdSchema.parse(userId),
      fullName: metadata ? toFullName(metadata, "לא ידוע") : "לא ידוע",
      domains,
      isAdmin,
      canCreateConnections,
      canManageUniquePopulationIndications,
    };

    return user;
  }

  /**
   * @throws {NotFoundException}
   */
  async getApplicationUserManagePermissionsDto(userId: UserID): Promise<ZGetApplicationUserManagePermissionsDto> {
    const [
      userDomainsRoles,
      userDomainClassifications,
      canManageAdmins,
      canManageCreateConnections,
      canManageUniquePopulationAssigners,
      canDeleteApplicationUsers,
    ] = await Promise.all([
      this.getApplicationUserDomainsRoles(userId, "manage"),
      this.getApplicationUserDomainClassifications(userId, "manage"),
      this.openFgaService
        .check({
          user: formatFGAObjectId({ type: "user", id: userId }),
          relation: "can_manage_admins",
          object: PLATFORM_FGA_INSTANCE,
        })
        .then(({ allowed }) => allowed ?? false),
      this.openFgaService
        .check({
          user: formatFGAObjectId({ type: "user", id: userId }),
          relation: "can_manage_create_connections",
          object: PLATFORM_FGA_INSTANCE,
        })
        .then(({ allowed }) => allowed ?? false),
      this.openFgaService
        .check({
          user: formatFGAObjectId({ type: "user", id: userId }),
          relation: "can_manage_unique_population_assigners",
          object: PLATFORM_FGA_INSTANCE,
        })
        .then(({ allowed }) => allowed ?? false),
      this.openFgaService
        .check({
          user: formatFGAObjectId({ type: "user", id: userId }),
          relation: "can_delete_application_users",
          object: PLATFORM_FGA_INSTANCE,
        })
        .then(({ allowed }) => allowed ?? false),
    ]);

    const user: ZGetApplicationUserManagePermissionsDto = {
      domains: userDomainsRoles.map((domain) => ({
        id: domain.id,
        roleNames: domain.roleNames,
        classifications: userDomainClassifications[domain.id.toString()] ?? [],
      })),
      canManageAdmins,
      canManageCreateConnections,
      canManageUniquePopulationAssigners,
      canDeleteApplicationUsers,
    };

    return user;
  }

  private async getDomainApplicationUsers(domainId: ObjectId, roleNames: readonly NonAdminRoleName[]) {
    const domainsRolesTuples = (
      await Promise.all(
        roleNames.map((roleName) =>
          this.openFgaService.readAll({
            object: formatFGAObjectId({ type: "domain", id: domainId.toString() }),
            relation: roleName,
          }),
        ),
      )
    ).flat();

    const usersMapByUserId = new Map<UserID, { userId: UserID; roleNames: NonAdminRoleName[] }>();

    domainsRolesTuples.forEach(({ key: { user, relation } }) => {
      const userId = userIdSchema.parse(parseFGAObjectId(user)?.id);
      const currentUser: { userId: UserID; roleNames: NonAdminRoleName[] } = usersMapByUserId.get(userId) ?? { userId, roleNames: [] };
      usersMapByUserId.set(userId, { userId, roleNames: [...currentUser.roleNames, relation as NonAdminRoleName] });
    });

    return {
      domainId,
      users: Array.from(usersMapByUserId.values()),
    };
  }

  async syncMongoFromOpenFga() {
    const [domains, roles, currentMongoApplicationUsers, admins, connectionCreators, uniquePopulationIndicationManagers] =
      await Promise.all([
        this.domainsService.getAllDomains(),
        this.rolesService.getAllRoles(),
        this.applicationUserModel.find().exec(),
        this.openFgaService.readAll({
          object: PLATFORM_FGA_INSTANCE,
          relation: "admin",
        }),
        this.openFgaService.readAll({
          object: PLATFORM_FGA_INSTANCE,
          relation: "can_create_connections",
        }),
        this.openFgaService.readAll({
          object: PLATFORM_FGA_INSTANCE,
          relation: "can_manage_unique_population_indications",
        }),
      ]);

    const domainsApplicationsUsers = await Promise.all(
      domains.map((domain) => this.getDomainApplicationUsers(domain._id, NON_ADMIN_ROLE_NAMES)),
    );

    const openFgaUserIdsSet = new Set<UserID>();
    const adminsSet = new Set<UserID>();
    const connectionCreatorsSet = new Set<UserID>();
    const uniquePopulationIndicationManagersSet = new Set<UserID>();

    domainsApplicationsUsers.forEach((domain) => {
      domain.users.forEach((user) => {
        openFgaUserIdsSet.add(user.userId);
      });
    });
    admins.forEach(({ key: { user } }) => {
      const userId = userIdSchema.parse(parseFGAObjectId(user)?.id);
      openFgaUserIdsSet.add(userId);
      adminsSet.add(userId);
    });
    connectionCreators.forEach(({ key: { user } }) => {
      const userId = userIdSchema.parse(parseFGAObjectId(user)?.id);
      openFgaUserIdsSet.add(userId);
      connectionCreatorsSet.add(userId);
    });
    uniquePopulationIndicationManagers.forEach(({ key: { user } }) => {
      const userId = userIdSchema.parse(parseFGAObjectId(user)?.id);
      openFgaUserIdsSet.add(userId);
      uniquePopulationIndicationManagersSet.add(userId);
    });

    const currentMongoApplicationUsersMapByUserId = new Map(currentMongoApplicationUsers.map((user) => [user.user_id, user]));

    const userIds = [...openFgaUserIdsSet];
    const userIdsNotInMongo = userIds.filter((userId) => !currentMongoApplicationUsersMapByUserId.get(userId));
    const usersInfoMap = new Map<UserID, GetUserInfoDto>();

    await Promise.all(
      userIdsNotInMongo.map(async (userId) => {
        const userInfo = await this.userInfoService.getUserInfoByUserId(userId, true);
        usersInfoMap.set(userId, userInfo);
      }),
    );

    const classificationsRecord: Record<string, Record<string, ObjectId[]>> = {};
    const chunks = chunk(userIds, 5);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (userId) => {
          const { objects: domains_classifications } = await this.openFgaService.listObjects({
            user: formatFGAObjectId({ type: "user", id: userId }),
            relation: "assigner",
            type: "domain_classification",
          });

          const classificationsByDomainId = this.openFgaService.getClassificationsByDomainID(domains_classifications);
          Object.entries(classificationsByDomainId).forEach(([domainId, classifications]) => {
            if (!classificationsRecord[userId]) {
              classificationsRecord[userId] = {};
            }
            classificationsRecord[userId][domainId] = classifications;
          });
        }),
      );
    }

    const usersRecordByUserId: Record<string, HydratedDocument<MongooseApplicationUser>> = {};

    userIds.forEach((userId) => {
      const isAdmin = adminsSet.has(userId);
      const canCreateConnections = connectionCreatorsSet.has(userId);
      const canManageUniquePopulationIndications = uniquePopulationIndicationManagersSet.has(userId);
      const currentMongoApplicationUser = currentMongoApplicationUsersMapByUserId.get(userId);

      const payload = {
        user_id: userId,
        domains: [],
        is_admin: isAdmin,
        can_create_connections: canCreateConnections,
        can_manage_unique_population_indications: canManageUniquePopulationIndications,
      } satisfies Pick<
        MongooseApplicationUser,
        "user_id" | "domains" | "is_admin" | "can_create_connections" | "can_manage_unique_population_indications"
      >;

      if (currentMongoApplicationUser) {
        currentMongoApplicationUser.overwrite({
          ...currentMongoApplicationUser.toObject(),
          ...payload,
        });
        usersRecordByUserId[userId] = currentMongoApplicationUser;
      } else {
        const userInfo = usersInfoMap.get(userId);
        usersRecordByUserId[userId] = new this.applicationUserModel({
          user_id: userId,
          first_name: userInfo?.first_name,
          last_name: userInfo?.last_name,
          domains: [],
          is_admin: isAdmin,
          can_create_connections: canCreateConnections,
          can_manage_unique_population_indications: canManageUniquePopulationIndications,
        });
      }
    });

    const rolesByNameMap = new Map(roles.map((role) => [role.name, role]));
    domainsApplicationsUsers.forEach((domain) => {
      domain.users.forEach((user) => {
        const userDocument = usersRecordByUserId[user.userId];

        if (!userDocument) {
          throw new InternalServerErrorException("Code didn't work - userDocument should always be defined");
        }

        const roles = user.roleNames.reduce<ApplicationUserDomain["roles"]>((acc, roleName) => {
          const role = rolesByNameMap.get(roleName);

          if (!role) {
            throw new NotFoundException(`Could not find role ${roleName} in mongo`);
          }

          acc.push(role._id);
          return acc;
        }, []);

        const classifications = classificationsRecord[user.userId]?.[domain.domainId.toString()] ?? [];
        userDocument.domains.push({ id: domain.domainId, roles, classifications: classifications });
      });
    });

    await this.applicationUserModel.bulkSave(Object.values(usersRecordByUserId));
    const userIdsOnlyInMongo = currentMongoApplicationUsers
      .filter(({ user_id }) => !openFgaUserIdsSet.has(user_id as UserID))
      .map(({ user_id }) => user_id);

    if (userIdsOnlyInMongo.length > 0) {
      await this.applicationUserModel.deleteMany({ user_id: { $in: userIdsOnlyInMongo } });
    }

    this.logger.log("Sync Application users successfully!");
  }

  async getLoggedUserPermissions(userId: UserID): Promise<Pick<ZGetLoggedUserInfoDto, "roleNames" | "isAdmin">> {
    const [isAdmin, ...hasRoles] = await Promise.all([
      this.openFgaService.isAdmin(userId),
      ...SHIELD_ROLE_NAMES.map(async (roleName) => {
        const { objects: domainObjects } = await this.openFgaService.listObjects({
          user: formatFGAObjectId({ type: "user", id: userId }),
          type: "domain",
          relation: roleName,
        });

        return { roleName, hasRole: domainObjects.length > 0 };
      }),
    ]);

    const roleNames = hasRoles.reduce<ShieldRoleName[]>((acc, { roleName, hasRole }) => {
      if (hasRole) {
        acc.push(roleName);
      }

      return acc;
    }, []);

    return {
      isAdmin,
      roleNames,
    };
  }

  async getLoggedUserPermissionsDisplay(loggedUser: LoggedUser): Promise<ZGetLoggedUserPermissionsDisplayDto | null> {
    const users = await this.applicationUserModel
      .aggregate<
        Pick<MongooseApplicationUser, "is_admin"> & {
          domains: (Pick<ApplicationUserDomain, "id"> & {
            roles: WithId<MongooseRole>[];
            domain_data: [Pick<MongooseDomain, "display_name">];
          })[];
        }
      >([
        {
          $match: {
            user_id: loggedUser.userId,
          },
        },
        {
          $addFields: { hasNoDomains: { $eq: ["$domains", []] } },
        },
        {
          $unwind: {
            path: "$domains",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "domains",
            localField: "domains.id",
            foreignField: "_id",
            as: "domains.domain_data",
            pipeline: [
              {
                $project: {
                  display_name: true,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "roles",
            localField: "domains.roles",
            foreignField: "_id",
            as: "domains.roles",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$name", SHIELD_ROLE_NAMES],
                  },
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: "$_id",
            is_admin: {
              $first: "$is_admin",
            },
            domains: {
              $push: "$domains",
            },
          },
        },
        {
          $addFields: {
            domains: {
              $cond: {
                if: "$hasNoDomains",
                then: [],
                else: "$domains",
              },
            },
          },
        },
        {
          $project: {
            domains: true,
            is_admin: true,
          },
        },
      ])
      .exec();

    const user = users[0];
    if (!user) {
      throw new NotFoundException(`Application User for loggedUser ${loggedUser.userId} not found`);
    }

    const rolesWithDomains = user.domains.reduce<Record<string, ZGetLoggedUserPermissionsDisplayDto["roles"][number]>>((acc, domain) => {
      domain.roles.forEach((role) => {
        const roleIdString = role._id.toString();
        if (!acc[roleIdString]) {
          acc[roleIdString] = {
            displayName: role.display_name,
            domainDisplayNames: [],
          };
        }

        acc[roleIdString]!.domainDisplayNames.push(domain.domain_data[0].display_name);
      });

      return acc;
    }, {});

    return {
      roles: Object.values(rolesWithDomains),
      isAdmin: user.is_admin,
    };
  }

  private async handleLensDomainsOwnerEvents(domainIds: ObjectId[]) {
    try {
      const aggregation = [
        {
          $unwind: {
            path: "$domains",
          },
        },
        {
          $match: {
            "domains.id": { $in: domainIds },
          },
        },
        {
          $lookup: {
            from: "roles",
            localField: "domains.roles",
            foreignField: "_id",
            as: "domains.roles",
          },
        },
        {
          $match: {
            "domains.roles": {
              $elemMatch: { name: SHIELD_ROLE_NAME.amlach },
            },
          },
        },
        {
          $lookup: {
            from: "domains",
            localField: "domains.id",
            foreignField: "_id",
            as: "domainData",
          },
        },
        {
          $unwind: {
            path: "$domainData",
          },
        },
        {
          $group: {
            _id: "$domains.id",
            display_name: {
              $first: "$domainData.display_name",
            },
            owners: { $addToSet: "$user_id" },
          },
        },
      ] satisfies PipelineStage[];

      const domainsWithOwners = await this.applicationUserModel.aggregate<DomainWithOwners>(aggregation).exec();

      await Promise.all(
        domainsWithOwners.map((domain) =>
          this.kafkaService.sendMessage("domain-owners", {
            event_type: "domain_owners",
            domain_id: domain._id.toString(),
            domain_display_name: domain.display_name,
            owners: domain.owners,
          }),
        ),
      );
    } catch (error) {
      this.logger.error(new Error(`Error in handleLensDomainsOwnerEvents`, { cause: error }));
    }
  }

  /**
   * @throws {ForbiddenException}
   */
  private async assertHasPermissionForAttributes(
    args:
      | {
          type: "create";
          user: Pick<ZCreateApplicationUserDto, ApplicationUserBooleanAttribute>;
          actorId: UserID;
        }
      | {
          type: "delete";
          user: Pick<ZCreateApplicationUserDto, ApplicationUserBooleanAttribute>;
          actorId: UserID;
        }
      | {
          type: "edit";
          currentUserData: Pick<ZGetApplicationUserDto, ApplicationUserBooleanAttribute>;
          newUserData: Pick<ZCreateApplicationUserDto, ApplicationUserBooleanAttribute>;
          actorId: UserID;
        },
  ) {
    const checkTypesConfig = {
      isAdmin: {
        shouldCheck: {
          create: ({ user }) => user.isAdmin,
          delete: ({ user }) => user.isAdmin,
          edit: ({ currentUserData, newUserData }) => currentUserData.isAdmin || currentUserData.isAdmin !== newUserData.isAdmin,
        },
        check: {
          user: formatFGAObjectId({ type: "user", id: args.actorId }),
          object: PLATFORM_FGA_INSTANCE,
          relation: "can_manage_admins",
        },
        notAllowedMessage: `Not permitted to ${args.type} user - has no permission to manage admins`,
      },
      canCreateConnections: {
        shouldCheck: {
          create: ({ user }) => user.canCreateConnections,
          delete: ({ user }) => user.canCreateConnections,
          edit: ({ currentUserData, newUserData }) => currentUserData.canCreateConnections !== newUserData.canCreateConnections,
        },
        check: {
          user: formatFGAObjectId({ type: "user", id: args.actorId }),
          object: PLATFORM_FGA_INSTANCE,
          relation: "can_manage_create_connections",
        },
        notAllowedMessage: `Not permitted to ${args.type} user - has no permission to manage connection creators`,
      },
      canManageUniquePopulationIndications: {
        shouldCheck: {
          create: ({ user }) => user.canManageUniquePopulationIndications,
          delete: ({ user }) => user.canManageUniquePopulationIndications,
          edit: ({ currentUserData, newUserData }) =>
            currentUserData.canManageUniquePopulationIndications !== newUserData.canManageUniquePopulationIndications,
        },
        check: {
          user: formatFGAObjectId({ type: "user", id: args.actorId }),
          object: PLATFORM_FGA_INSTANCE,
          relation: "can_manage_unique_population_assigners",
        },
        notAllowedMessage: `Not permitted to ${args.type} user - has no permission to manage canManageUniquePopulationIndications`,
      },
    } as const satisfies Record<
      ApplicationUserBooleanAttribute,
      {
        shouldCheck: { [type in (typeof args)["type"]]: (createArgs: Extract<typeof args, { type: type }>) => boolean };
        check: FGAClientCheckRequest;
        notAllowedMessage: string;
      }
    >;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checks = Object.values(checkTypesConfig).filter((config) => config.shouldCheck[args.type](args as any));
    const results = await Promise.all(checks.map((config) => this.openFgaService.check(config.check)));

    checks.forEach((config, index) => {
      const allowed = results[index]!.allowed;

      if (!allowed) {
        throw new ForbiddenException(config.notAllowedMessage);
      }
    });
  }

  /**
   * @throws {ForbiddenException}
   */
  private async assertHasPermissionForDomains({
    userId,
    actorId,
    domains,
  }: Pick<ZCreateApplicationUserDto, "userId" | "actorId" | "domains">) {
    const actorFgaId = formatFGAObjectId({ type: "user", id: actorId });

    const checks = domains.reduce<ClientBatchCheckRequest["checks"]>((acc, domain) => {
      acc.push(
        ...domain.roleNames.map((roleName) => ({
          user: actorFgaId,
          object: formatFGAObjectId({
            type: "domain",
            id: domain.id.toString(),
          }),
          relation: `can_manage_${roleName}s`,
        })),
      );

      acc.push(
        ...domain.classifications.map((classification) => {
          return {
            user: actorFgaId,
            object: formatFGAObjectId({
              type: "domain_classification",
              id: OpenFgaService.formatDomainClassification(domain.id, classification),
            }),
            relation: FGADomain_classificationRelationConstants.can_manage_assigners,
          };
        }),
      );

      return acc;
    }, []);

    const { result } = await this.openFgaService.batchCheck({ checks });

    result.forEach(({ allowed, request }) => {
      if (!allowed) {
        let message = `Not Permitted to alter User ${userId}`;
        const parsedObject = parseFGAObjectId(request.object);

        if (parsedObject) {
          if (parsedObject.type === "domain_classification") {
            message += ` No permisssion found for domain_classification ${parsedObject.id}`;
          } else {
            message += ` No permisssion found for ${request.relation} in domain ${parsedObject.id}`;
          }
        }

        throw new ForbiddenException(message);
      }
    });
  }

  private generateApplicationUserTuples(user: OpenFgaFormattedUser): FGATupleKey[] {
    return [
      ...this.openFgaService.generateDomainsToUserTuples(user.userId, user.domains),
      ...(user.isAdmin ? [this.openFgaService.generateAdminTuple(user.userId)] : []),
      ...(user.canCreateConnections ? [this.openFgaService.generateCanCreateConnectionsTuple(user.userId)] : []),
      ...(user.canManageUniquePopulationIndications
        ? [this.openFgaService.generateCanManageUniquePopulationIndicationsTuple(user.userId)]
        : []),
    ];
  }

  private async openFgaDomainsToDomainsWithRoleIds(
    domains: OpenFgaFormattedUser["domains"],
  ): Promise<OpenFgaFormattedUserDomainWithRoleIds[]> {
    const roles = await this.rolesService.getRolesByNames([...new Set(domains.flatMap((domain) => domain.roleNames))]);
    const rolesByNameMap = new Map(roles.map((role) => [role.name, role]));

    const domainsWithRoleIds = domains.map<OpenFgaFormattedUserDomainWithRoleIds>((domain) => {
      const roleIds = domain.roleNames.reduce<OpenFgaFormattedUserDomainWithRoleIds["roles"]>((acc, roleName) => {
        const role = rolesByNameMap.get(roleName);

        if (!role) {
          throw new NotFoundException(`Could not find role ${roleName} in mongo`);
        }

        acc.push({ id: role._id, name: roleName });

        return acc;
      }, []);

      return { ...domain, roles: roleIds };
    });

    return domainsWithRoleIds;
  }

  /**
   * @audits
   * @throws {ConflictException, ForbiddenException}
   */
  async createApplicationUser({
    domains,
    canCreateConnections,
    canManageUniquePopulationIndications,
    isAdmin,
    userId: newUserId,
    actorId,
  }: ZCreateApplicationUserDto): Promise<ZCreateApplicationUserReturnDto> {
    await Promise.all([
      this.assertHasPermissionForDomains({
        userId: newUserId,
        actorId,
        domains,
      }),
      this.assertHasPermissionForAttributes({
        type: "create",
        actorId,
        user: { isAdmin, canCreateConnections, canManageUniquePopulationIndications },
      }),
    ]);

    const [isExits, newUserInfo] = await Promise.all([
      this.getFormattedOpenFgaUser(newUserId)
        .then((data) => !!data)
        .catch((error) => {
          if (error instanceof NotFoundException) {
            return false;
          }

          throw error;
        }),
      this.userInfoService.getUserInfoByUserId(newUserId, true),
    ]);

    if (isExits) {
      throw new ConflictException(`User ${newUserId} already exists`);
    }

    const domainsWithRoleIds = await this.openFgaDomainsToDomainsWithRoleIds(domains);
    const now = new Date();

    const applicationUser: MongooseApplicationUser = {
      user_id: newUserId,
      ...(newUserInfo.first_name ? { first_name: newUserInfo.first_name } : {}),
      ...(newUserInfo.last_name ? { last_name: newUserInfo.last_name } : {}),
      domains: domainsWithRoleIds.map((domain) => ({ ...domain, roles: domain.roles.map(({ id }) => id) })),
      is_admin: isAdmin,
      can_create_connections: canCreateConnections,
      can_manage_unique_population_indications: canManageUniquePopulationIndications,
      create_date: now,
      given_by: actorId,
      last_change: now,
      last_changed_by: actorId,
    };

    return await withRollbacks(async (registerRollback) => {
      const tuples = this.generateApplicationUserTuples({
        userId: newUserId,
        domains,
        isAdmin,
        canCreateConnections,
        canManageUniquePopulationIndications,
      });
      await this.openFgaService.writeTuplesBatch(tuples);
      registerRollback(() => this.openFgaService.deleteTuplesBatch(tuples), "OpenFga createApplicationUser");

      const result = await this.applicationUserModel.create(applicationUser);

      this.auditingService.insertApplicationUserAudits({
        actorUserId: actorId,
        operation: OP.Create,
        resourceId: result._id,
        domainsDiff: domainsWithRoleIds.map((domain) => ({
          id: domain.id,
          diffType: "new",
          newClassifications: domain.classifications,
          newRoles: domain.roles,
          deletedClassifications: [],
          deletedRoles: [],
        })),
        applicationUserIndicationsDiff: applicationUserBooleanAttributes.reduce<ApplicationUserIndicationDiff[]>((acc, attribute) => {
          if (applicationUser[attribute] === true) {
            acc.push({
              action_type: "ON",
              kind: booleanAttributeNameToSnakeCase[attribute],
            });
          }

          return acc;
        }, []),
        metadata: { user_id: newUserId },
      });

      const amlachDomains = domains.filter((domain) => domain.roleNames.includes(SHIELD_ROLE_NAME.amlach));
      this.handleLensDomainsOwnerEvents(amlachDomains.map((domain) => domain.id));
      const aggregation = [{ $match: { _id: result._id } }, ...APPLICATION_USER_DATA_PIPELINE] as const satisfies PipelineStage[];

      const [newApplicationUser] = await this.applicationUserModel.aggregate<ApplicationUserData>(aggregation).exec();

      return this.formatApplicationUserDataToListDto(newApplicationUser);
    });
  }

  /**
   * @audits
   * @throws {NotFoundException, ForbiddenException}
   */
  async editApplicationUserByUserId({
    domains,
    canCreateConnections,
    canManageUniquePopulationIndications,
    isAdmin,
    userId,
    actorId,
  }: ZEditApplicationUserDto): Promise<ZEditApplicationUserReturnDto> {
    const [user, currentMongoApplicationUser] = await Promise.all([
      this.getFormattedOpenFgaUser(userId),
      this.applicationUserModel.findOne<{ _id: ObjectId }>({ user_id: userId }, { _id: true }),
    ]);

    if (!currentMongoApplicationUser) {
      throw new NotFoundException(`Could not find user ${userId} in mongo `);
    }

    const [currDomainsWithRoleIds, newDomainsWithRoleIds] = await Promise.all([
      this.openFgaDomainsToDomainsWithRoleIds(user.domains),
      this.openFgaDomainsToDomainsWithRoleIds(domains),
    ]);

    const { domainsDiff, applicationUserIndicationsDiff } = getApplicationUserDiff({
      currApplicationUser: { ...user, domains: currDomainsWithRoleIds },
      newApplicationUser: { canCreateConnections, canManageUniquePopulationIndications, isAdmin, userId, domains: newDomainsWithRoleIds },
    });

    if (domainsDiff.length === 0 && applicationUserIndicationsDiff.length === 0) {
      const aggregation = [
        { $match: { _id: currentMongoApplicationUser._id } },
        ...APPLICATION_USER_DATA_PIPELINE,
      ] as const satisfies PipelineStage[];

      const [updatedApplicationUser] = await this.applicationUserModel.aggregate<ApplicationUserData>(aggregation).exec();

      return this.formatApplicationUserDataToListDto(updatedApplicationUser);
    }

    await Promise.all([
      this.assertHasPermissionForDomains({
        userId,
        actorId,
        domains: domainsDiff.map((domainDiff) => ({
          id: domainDiff.id,
          classifications: [...domainDiff.newClassifications, ...domainDiff.deletedClassifications],
          roleNames: [...domainDiff.newRoles.map((role) => role.name), ...domainDiff.deletedRoles.map((role) => role.name)],
        })),
      }),
      this.assertHasPermissionForAttributes({
        type: "edit",
        actorId,
        currentUserData: user,
        newUserData: { isAdmin, canCreateConnections, canManageUniquePopulationIndications },
      }),
    ]);

    await withRollbacks(async (registerRollback) => {
      const { domainsWriteData, domainsDeleteData } = domainsDiff.reduce<{
        domainsWriteData: EditApplicationUserDomainDto[];
        domainsDeleteData: EditApplicationUserDomainDto[];
      }>(
        (acc, domainDiff) => {
          acc.domainsWriteData.push({
            id: domainDiff.id,
            classifications: domainDiff.newClassifications,
            roleNames: domainDiff.newRoles.map((role) => role.name),
          });
          acc.domainsDeleteData.push({
            id: domainDiff.id,
            classifications: domainDiff.deletedClassifications,
            roleNames: domainDiff.deletedRoles.map((role) => role.name),
          });

          return acc;
        },
        { domainsWriteData: [], domainsDeleteData: [] },
      );

      const attributeTuples = applicationUserBooleanAttributes.reduce(
        (acc, attribute) => {
          acc.create[attribute] = false;
          acc.delete[attribute] = false;

          return acc;
        },
        { create: {}, delete: {} } as {
          create: Record<ApplicationUserBooleanAttribute, boolean>;
          delete: Record<ApplicationUserBooleanAttribute, boolean>;
        },
      );

      applicationUserIndicationsDiff.forEach((diff) => {
        if (diff.action_type === "ON") {
          attributeTuples.create[booleanAttributeNameToCamelCase[diff.kind]] = true;
        } else {
          attributeTuples.delete[booleanAttributeNameToCamelCase[diff.kind]] = true;
        }
      });

      const createTuples = this.generateApplicationUserTuples({
        userId,
        domains: domainsWriteData,
        ...attributeTuples.create,
      });
      const deleteTuples = this.generateApplicationUserTuples({
        userId,
        domains: domainsDeleteData,
        ...attributeTuples.delete,
      });

      await this.openFgaService.writeBatch({ writes: createTuples, deletes: deleteTuples });
      registerRollback(
        () => this.openFgaService.writeBatch({ writes: deleteTuples, deletes: createTuples }),
        "OpenFga editApplicationUser",
      );

      await this.applicationUserModel.updateOne(
        { user_id: userId },
        {
          $set: {
            domains: newDomainsWithRoleIds.map((domain) => ({ ...domain, roles: domain.roles.map((role) => role.id) })),
            last_change: new Date(),
            last_changed_by: actorId,
            is_admin: isAdmin,
            can_create_connections: canCreateConnections,
            can_manage_unique_population_indications: canManageUniquePopulationIndications,
          } satisfies Pick<
            MongooseApplicationUser,
            | "domains"
            | "last_change"
            | "last_changed_by"
            | "is_admin"
            | "can_create_connections"
            | "can_manage_unique_population_indications"
          >,
        },
      );
    });

    this.auditingService.insertApplicationUserAudits({
      actorUserId: actorId,
      operation: OP.Update,
      resourceId: currentMongoApplicationUser._id,
      domainsDiff,
      applicationUserIndicationsDiff,
      metadata: { user_id: userId },
    });

    const amlachDomains = domainsDiff.filter(
      (domain) =>
        domain.newRoles.some((role) => role.name === SHIELD_ROLE_NAME.amlach) ||
        domain.deletedRoles.some((role) => role.name === SHIELD_ROLE_NAME.amlach),
    );
    this.handleLensDomainsOwnerEvents(amlachDomains.map((domain) => domain.id));

    const aggregation = [
      { $match: { _id: currentMongoApplicationUser._id } },
      ...APPLICATION_USER_DATA_PIPELINE,
    ] as const satisfies PipelineStage[];

    const [updatedApplicationUser] = await this.applicationUserModel.aggregate<ApplicationUserData>(aggregation).exec();

    return this.formatApplicationUserDataToListDto(updatedApplicationUser);
  }

  /**
   * @audits
   * @throws {NotFoundException, ForbiddenException}
   */
  async deleteApplicationUserByUserId({ actorId, userId }: ZDeleteApplicationUserDto): Promise<void> {
    const applicationUser = await this.getFormattedOpenFgaUser(userId);

    await Promise.all([
      this.assertHasPermissionForDomains({
        userId,
        actorId,
        domains: applicationUser.domains,
      }),
      this.assertHasPermissionForAttributes({
        type: "delete",
        actorId,
        user: {
          isAdmin: applicationUser.isAdmin,
          canCreateConnections: applicationUser.canCreateConnections,
          canManageUniquePopulationIndications: applicationUser.canManageUniquePopulationIndications,
        },
      }),
    ]);

    await withRollbacks(async (registerRollback) => {
      const tuples = this.generateApplicationUserTuples({
        userId: userId,
        domains: applicationUser.domains,
        isAdmin: applicationUser.isAdmin,
        canCreateConnections: applicationUser.canCreateConnections,
        canManageUniquePopulationIndications: applicationUser.canManageUniquePopulationIndications,
      });
      await this.openFgaService.deleteTuplesBatch(tuples);
      registerRollback(() => this.openFgaService.writeTuples(tuples), "OpenFga deleteApplicationUser");

      const [mongoApplicationUser, domainsWithRoleIds] = await Promise.all([
        this.applicationUserModel.findOne<{ _id: ObjectId }>({ user_id: userId }, { _id: true }),
        this.openFgaDomainsToDomainsWithRoleIds(applicationUser.domains),
      ]);

      if (!mongoApplicationUser) {
        this.logger.warn(`Failed to delete ${userId} from MongoDB`);
      } else {
        await this.applicationUserModel.deleteOne({ user_id: userId });
        this.auditingService.insertApplicationUserAudits({
          actorUserId: actorId,
          operation: OP.Delete,
          resourceId: mongoApplicationUser._id,
          domainsDiff: domainsWithRoleIds.map((domain) => ({
            id: domain.id,
            diffType: "deleted",
            deletedClassifications: domain.classifications,
            deletedRoles: domain.roles,
            newClassifications: [],
            newRoles: [],
          })),
          applicationUserIndicationsDiff: applicationUserBooleanAttributes.reduce<ApplicationUserIndicationDiff[]>((acc, attribute) => {
            if (applicationUser[attribute] === true) {
              acc.push({
                action_type: "OFF",
                kind: booleanAttributeNameToSnakeCase[attribute],
              });
            }

            return acc;
          }, []),
          metadata: { user_id: userId },
        });
      }
    });
    const amlachDomains = applicationUser.domains.filter((domain) => domain.roleNames.includes(SHIELD_ROLE_NAME.amlach));
    this.handleLensDomainsOwnerEvents(amlachDomains.map((domain) => domain.id));
  }
}
