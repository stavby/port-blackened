import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserID, userIdSchema } from "@port/common-schemas";
import {
  ClientBatchCheckItem,
  ClientBatchCheckRequest,
  FGADomainRelationConstants,
  FGAPermission_groupRelationConstants,
  FGAPermission_groupRelations,
  formatFGAObjectId,
  parseFGAObjectId,
  PLATFORM_FGA_INSTANCE,
} from "@port/openfga-client";
import { withRollbacks } from "@port/server-utils";
import { PermissionGroup as MongoosePermissionGroup, User as MongooseUser, OP } from "@port/shield-models";
import { CreatePermissionGroupDto, GetLoggedUserGroupPermissionsDto, ObjectIdBrand } from "@port/shield-schemas";
import { getUserIndicationsDiff } from "@port/shield-utils";
import { differenceBy } from "lodash";
import { ObjectId, WithId } from "mongodb";
import { Model } from "mongoose";
import AuditingService from "src/auditing/auditing.service";
import { InsertUserAudit } from "src/auditing/auditing.types";
import { LoggedUser } from "src/auth/auth.interface";
import { ExcelService } from "src/excel/excel.service";
import { OpenFgaService } from "src/openfga/openfga.service";
import { PermissionTablesService } from "src/permission_tables/permission_tables.service";
import { UserPermissionGroup } from "src/user/user.classes";
import { DEFAULT_USER_ATTRIBUTES_SERVER } from "src/user/user.constants";
import { MergedPermissionTable } from "src/user/user.interfaces";
import { UserService } from "src/user/user.service";
import { getDomainsDiffServer, getPermissionTablesDiffServer } from "src/user/user.utils";
import { isMongoDuplicateKeyError, toMongoObjectId } from "src/utils/mongo.utils";
import { GET_PERMISSION_GROUP_DATA_PERMISSIONS_DTO_AGG } from "./permission_groups.aggregations";
import {
  GetUsersByPermissionGroup,
  ZEditPermissionGroupDataPermissionsDto,
  ZEditPermissionGroupDataPermissionsResDto,
  ZEditPermissionGroupDetailsPermissionsDto,
  ZGetPermissionGroupDataPermissionsDto,
  ZGetPermissionGroupsDataPermissionsResDto,
  ZGetPermissionGroupsDto,
} from "./permission_groups.dto";

@Injectable()
export class PermissionGroupsService {
  private readonly logger = new Logger(PermissionGroupsService.name);

  constructor(
    @InjectModel(MongoosePermissionGroup.name) private readonly permissionGroupModel: Model<MongoosePermissionGroup>,
    @InjectModel(MongooseUser.name) private readonly userModel: Model<MongooseUser>,

    private readonly excelService: ExcelService,
    private readonly auditingService: AuditingService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly openFgaService: OpenFgaService,
    private readonly permissionTableService: PermissionTablesService,
  ) {}

  async getPermissionGroups(loggedUser: LoggedUser): Promise<ZGetPermissionGroupsDto[]> {
    const permissionGroups = await this.permissionGroupModel
      .find({}, {
        _id: true,
        name: true,
        description: true,
        color: true,
        ownerId: true,
        ownerName: true,
        coOwners: true,
      } satisfies Omit<Record<keyof ZGetPermissionGroupsDto, true>, "can_delete">)
      .lean();

    const checks: ClientBatchCheckItem[] = permissionGroups.map((pg) => ({
      user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
      relation: FGAPermission_groupRelationConstants.can_delete_permission_group,
      object: formatFGAObjectId({ type: "permission_group", id: pg._id.toString() }),
    }));
    const { result } = await this.openFgaService.batchCheck({ checks });

    const canDeleteSet = new Set();
    result.forEach(({ allowed, request }) => {
      if (allowed) {
        const groupId = parseFGAObjectId(request.object)?.id;
        if (groupId) {
          canDeleteSet.add(groupId);
        }
      }
    });

    return permissionGroups.map((permissionGroup) => ({
      ...permissionGroup,
      ownerId: userIdSchema.parse(permissionGroup.ownerId),
      coOwners: permissionGroup.coOwners.map((coOwner) => ({
        ...coOwner,
        userId: userIdSchema.parse(coOwner.userId),
      })),
      can_delete: canDeleteSet.has(permissionGroup._id.toString()),
    }));
  }

  async getPermissionGroupById(permissionGroupId: ObjectId): Promise<WithId<MongoosePermissionGroup> | null> {
    const permissionGroup = await this.permissionGroupModel.findById(permissionGroupId);

    return permissionGroup?.toObject() || null;
  }

  async getPermissionGroupsByIds(permissionGroupIds: ObjectId[]): Promise<WithId<MongoosePermissionGroup>[]> {
    if (permissionGroupIds.length === 0) return [];

    return this.permissionGroupModel.find({ _id: { $in: permissionGroupIds } }).lean();
  }

  /**
   * @throws {ConflictException}
   */
  async createPermissionGroup(permission_group: CreatePermissionGroupDto, loggedUser: LoggedUser): Promise<ObjectId> {
    try {
      const allowedDomains = await this.openFgaService.getUserDomainIdsByRelation(
        loggedUser.userId,
        FGADomainRelationConstants.can_create_permission_group,
      );

      if (allowedDomains.length === 0) {
        throw new ForbiddenException(`No permissions found for create permission group ${permission_group.name}`);
      }

      const color = `#${Array.from({ length: 3 }, () =>
        Math.floor(200 + Math.random() * 55)
          .toString(16)
          .padStart(2, "0"),
      ).join("")}`;

      return await withRollbacks(async (registerRollback) => {
        const insertedObject = await this.permissionGroupModel.create({
          name: permission_group.name,
          description: permission_group.description ?? "",
          ownerId: loggedUser.userId,
          ownerName: loggedUser.displayName,
          coOwners: [],
          color,
          attributes: {
            mask: DEFAULT_USER_ATTRIBUTES_SERVER.mask,
            deceased_population: DEFAULT_USER_ATTRIBUTES_SERVER.deceased_population,
          },
          domains: [],
          permission_tables: [],
        } satisfies MongoosePermissionGroup);
        registerRollback(() => this.permissionGroupModel.deleteOne(insertedObject._id), "Mongo users deletePermissionGroupById");

        await this.openFgaService.writeTuples([
          {
            user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
            relation: FGAPermission_groupRelationConstants.owner,
            object: formatFGAObjectId({
              type: "permission_group",
              id: insertedObject._id.toString(),
            }),
          },
          {
            user: PLATFORM_FGA_INSTANCE,
            relation: "platform",
            object: formatFGAObjectId({
              type: "permission_group",
              id: insertedObject._id.toString(),
            }),
          },
        ]);

        return insertedObject._id;
      });
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) throw new ConflictException("קבוצת הרשאה עם השם הזה כבר קיימת במערכת");
      throw error;
    }
  }

  private async assertCanUpdatePermissionGroup(loggedUserId: LoggedUser["userId"], groupId: ObjectId): Promise<void> {
    const { allowed } = await this.openFgaService.check({
      user: formatFGAObjectId({ type: "user", id: loggedUserId }),
      relation: FGAPermission_groupRelationConstants.can_update_details,
      object: formatFGAObjectId({ type: "permission_group", id: groupId.toString() }),
    });

    if (!allowed) {
      throw new ForbiddenException(`User doesnt have permissions to edit this permissions group with id ${groupId}`);
    }
  }

  /**
   * @throws {ConflictException}
   */
  async editPermissionGroupDetailsById(
    groupId: ObjectId,
    { name, description, ownerId, ownerName, coOwners }: ZEditPermissionGroupDetailsPermissionsDto,
    loggedUser: LoggedUser,
  ): Promise<void> {
    try {
      await this.assertCanUpdatePermissionGroup(loggedUser.userId, groupId);

      const currentGroup = await this.getPermissionGroupById(groupId);
      if (!currentGroup) {
        throw new NotFoundException(`הקבוצה של הרשאות עם המזהה ${groupId} לא נמצאת`);
      }

      await withRollbacks(async (registerRollback) => {
        await this.permissionGroupModel.updateOne({ _id: groupId }, { $set: { name, description, ownerId, ownerName, coOwners } });
        registerRollback(
          () =>
            this.permissionGroupModel.updateOne(
              { _id: groupId },
              {
                $set: {
                  name: currentGroup.name,
                  description: currentGroup.description,
                  ownerId: currentGroup.ownerId,
                  ownerName: currentGroup.ownerName,
                  coOwners: currentGroup.coOwners,
                },
              },
            ),
          "Mongo permission group editPermissionGroupById",
        );

        if (currentGroup.ownerId !== ownerId) {
          const newOwnerTuple = {
            user: formatFGAObjectId({ type: "user", id: ownerId }),
            relation: FGAPermission_groupRelationConstants.owner,
            object: formatFGAObjectId({
              type: "permission_group",
              id: groupId.toString(),
            }),
          };
          const previousownerTuple = {
            user: formatFGAObjectId({ type: "user", id: userIdSchema.parse(currentGroup.ownerId) }),
            relation: FGAPermission_groupRelationConstants.owner,
            object: formatFGAObjectId({
              type: "permission_group",
              id: groupId.toString(),
            }),
          };
          await this.openFgaService.write({
            writes: [newOwnerTuple],
            deletes: [previousownerTuple],
          });
          registerRollback(
            () =>
              this.openFgaService.write({
                writes: [previousownerTuple],
                deletes: [newOwnerTuple],
              }),
            "openfga editpermissiongroup owner",
          );
        }

        const added = differenceBy(coOwners, currentGroup.coOwners, "userId");
        const removed = differenceBy(currentGroup.coOwners, coOwners, "userId");

        if (added.length > 0 || removed.length > 0) {
          const newCoOwnersTuples = added.map((addedUser) => ({
            user: formatFGAObjectId({ type: "user", id: addedUser.userId }),
            relation: FGAPermission_groupRelationConstants.co_owner,
            object: formatFGAObjectId({
              type: "permission_group",
              id: groupId.toString(),
            }),
          }));
          const previousCoOwnersTuples = removed.map((removedUser) => ({
            user: formatFGAObjectId({ type: "user", id: userIdSchema.parse(removedUser.userId) }),
            relation: FGAPermission_groupRelationConstants.co_owner,
            object: formatFGAObjectId({
              type: "permission_group",
              id: groupId.toString(),
            }),
          }));

          await this.openFgaService.write({
            writes: newCoOwnersTuples,
            deletes: previousCoOwnersTuples,
          });
        }
      });
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) throw new ConflictException("קבוצת הרשאה עם השם הזה כבר קיימת במערכת");
      throw error;
    }
  }

  /**
   * @throws {NotFoundException}
   */
  async deletePermissionGroupById(id: ObjectId, loggedUser: LoggedUser): Promise<void> {
    const { allowed } = await this.openFgaService.check({
      user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
      relation: FGAPermission_groupRelationConstants.can_delete_permission_group,
      object: formatFGAObjectId({ type: "permission_group", id: id.toString() }),
    });

    if (!allowed) {
      throw new ForbiddenException(`User doesnt have permissions to delete this permissions group with id ${id}`);
    }

    const oldGroup = await this.getPermissionGroupById(id);

    if (!oldGroup) {
      throw new NotFoundException(`Permission group with id ${id} not found`);
    }

    const usersToUpdate = await this.userModel.find({
      permission_groups: { $elemMatch: { id } },
    });

    await withRollbacks(async (registerRollback) => {
      await this.userModel.updateMany({ permission_groups: { $elemMatch: { id } } }, { $pull: { permission_groups: { id } } });
      registerRollback(
        () => this.userModel.updateMany({ _id: { $in: usersToUpdate.map((u) => u._id) } }, { $push: { permission_groups: { id } } }),
        "Mongo users deletePermissionGroupById",
      );

      const deletedPermissionGroup = await this.permissionGroupModel.deleteOne({ _id: id });

      if (deletedPermissionGroup.deletedCount === 0) {
        throw new NotFoundException(`Permission group with id ${id} not found`);
      }

      registerRollback(() => this.permissionGroupModel.create(oldGroup), "Mongo permission group deletePermissionGroupById");

      const deleteCoOwnersTuples = oldGroup.coOwners.map((coOwner) => ({
        user: formatFGAObjectId({ type: "user", id: userIdSchema.parse(coOwner.userId) }),
        relation: FGAPermission_groupRelationConstants.co_owner,
        object: formatFGAObjectId({ type: "permission_group", id: id.toString() }),
      }));

      const deleteOwnerTuple = {
        user: formatFGAObjectId({ type: "user", id: userIdSchema.parse(oldGroup.ownerId) }),
        relation: FGAPermission_groupRelationConstants.owner,
        object: formatFGAObjectId({
          type: "permission_group",
          id: id.toString(),
        }),
      };

      await this.openFgaService.deleteTuples([deleteOwnerTuple, ...deleteCoOwnersTuples]);
    });

    const insertAuditData = usersToUpdate.map<InsertUserAudit>((user) => ({
      actorUserId: loggedUser.userId,
      domainsDiff: [],
      operation: OP.Update,
      resource_id: user._id,
      userAttributesDiff: [],
      permissionGroupDiff: { newPermissionGroups: [], deletedPermissionGroups: [id] },
      permissionTablesDiff: [],
    }));

    this.auditingService.insertUserAudits(...insertAuditData);

    this.userService.invalidateUsersDictCache();
  }

  async getPermissionGroupsExcel(loggedUser: LoggedUser): Promise<unknown> {
    const permissionGroups = await this.getPermissionGroups(loggedUser);

    const permissionGroupsExcelFile = this.excelService.convertToExcel(permissionGroups, [
      { name: "name", displayName: "שם קבוצת הרשאה", options: { wch: 17 } },
      { name: "description", displayName: "תיאור", options: { wch: 45 } },
      { name: "ownerId", displayName: "מזהה בעלים", options: { wch: 20 } },
      { name: "ownerName", displayName: "שם בעלים", options: { wch: 20 } },
    ]);

    return permissionGroupsExcelFile;
  }

  /**
   * @throws {ForbiddenException}
   */
  async checkHasPermissionGroupDataPermissions(
    loggedUserId: LoggedUser["userId"],
    permissionGroup: WithId<Pick<MongoosePermissionGroup, "domains" | "attributes">>,
    options: { throw: boolean },
  ) {
    try {
      await Promise.all([
        this.userService.checkPermissionForDomains(loggedUserId, permissionGroup.domains, {
          message: (domainId: string) => `
        User ${loggedUserId} is not allowed to edit permission group with id ${permissionGroup._id}:
         has no permission to the domain with id ${domainId}`,
          throw: true,
        }),
        this.userService.assertHasPermissionsForSimpleAttributes(loggedUserId, permissionGroup.attributes, permissionGroup.domains),
      ]);
      return true;
    } catch (error) {
      if (!options.throw && error instanceof ForbiddenException) {
        return false;
      }

      throw error;
    }
  }

  async assertCanChangeGroupsUsers(
    loggedUserId: LoggedUser["userId"],
    permissionGroups: WithId<Pick<MongoosePermissionGroup, "domains" | "attributes">>[],
  ) {
    const mergedDomainsRecord = permissionGroups.reduce<Record<string, { id: string; classifications: string[] }>>(
      (acc, permissionGroup) => {
        permissionGroup.domains.forEach((domain) => {
          const domainId = domain.id.toString();
          if (!acc[domainId]) {
            acc[domainId] = { id: domainId, classifications: [] };
          }

          acc[domainId].classifications = [...new Set([...acc[domainId].classifications, ...domain.classifications.map(String)])];
        });

        return acc;
      },
      {},
    );

    const [canChangeUsers, hasDataPermissions] = await Promise.all([
      this.openFgaService
        .batchCheck({
          checks: permissionGroups.map((permissionGroup) => ({
            user: formatFGAObjectId({ type: "user", id: loggedUserId }),
            relation: FGAPermission_groupRelationConstants.can_change_users,
            object: formatFGAObjectId({ type: "permission_group", id: permissionGroup._id.toString() }),
          })),
        })
        .then(({ result }) => {
          result.forEach(({ allowed, request }) => {
            if (!allowed) {
              throw new ForbiddenException(`User doesnt have permissions to change users in this permissions group ${request.object}`);
            }
          });

          return true;
        }),
      this.userService.checkPermissionForDomains(loggedUserId, Object.values(mergedDomainsRecord), {
        message: (domainId: string) => `
        User ${loggedUserId} is not allowed to change users of permission groups:
         has no permission to the domain with id ${domainId}`,
        throw: true,
      }),
      permissionGroups.map((permissionGroup) =>
        this.userService.assertHasPermissionsForSimpleAttributes(loggedUserId, permissionGroup.attributes, permissionGroup.domains),
      ),
    ]);

    return canChangeUsers && hasDataPermissions;
  }

  /**
   * @throws {NotFoundException}
   */
  async addPermissionGroupToUsers(loggedUser: LoggedUser, permissionGroupId: ObjectId, userIds: UserID[]) {
    const permissionGroup = await this.getPermissionGroupById(permissionGroupId);

    if (!permissionGroup) {
      throw new NotFoundException(`Permission group ${permissionGroupId} not exist `);
    }

    await this.assertCanChangeGroupsUsers(loggedUser.userId, [permissionGroup]);

    const now = new Date();
    const userPermissionGroup: UserPermissionGroup = { id: permissionGroupId, given_by: loggedUser.userId, registration_date: now };

    const usersExist = await this.userModel.find({ user_id: { $in: userIds }, "catalogs.datalake": { $exists: true } }, { user_id: true });
    const usersNotExist = userIds.filter((userId) => !usersExist.some((user) => user.user_id === userId));

    //NOA: instead of going to users service update directly the mongo in one many req
    await Promise.all(
      usersNotExist.map((userId) =>
        this.userService.createUser(
          {
            user_id: userId,
            attributes: DEFAULT_USER_ATTRIBUTES_SERVER,
            domains: [],
            permission_tables: [],
            permission_groups: [permissionGroupId],
          },
          loggedUser,
        ),
      ),
    );

    const usersToUpdate = await this.userModel.find(
      { _id: { $in: usersExist.map((user) => user._id) }, permission_groups: { $not: { $elemMatch: { id: permissionGroupId } } } },
      { _id: true },
    );

    await this.userModel.updateMany(
      { _id: { $in: usersToUpdate.map((user) => user._id) } },
      { $push: { permission_groups: userPermissionGroup } },
    );

    const insertAuditData = usersToUpdate.map<InsertUserAudit>((user) => ({
      actorUserId: loggedUser.userId,
      domainsDiff: [],
      operation: OP.Update,
      resource_id: user._id,
      userAttributesDiff: [],
      permissionGroupDiff: { newPermissionGroups: [permissionGroupId], deletedPermissionGroups: [] },
      permissionTablesDiff: [],
    }));

    this.auditingService.insertUserAudits(...insertAuditData);

    this.userService.invalidateUsersDictCache();
  }

  /**
   * @throws {NotFoundException}
   */
  async deletePermissionGroupFromUser(loggedUser: LoggedUser, permissionGroupId: ObjectId, userObjId: ObjectId) {
    const permissionGroup = await this.getPermissionGroupById(permissionGroupId);

    if (!permissionGroup) {
      throw new NotFoundException(`Permission group ${permissionGroupId} not exist`);
    }

    await this.assertCanChangeGroupsUsers(loggedUser.userId, [permissionGroup]);

    const result = await this.userModel.updateOne(
      { _id: userObjId, permission_groups: { $elemMatch: { id: permissionGroupId } } },
      { $pull: { permission_groups: { id: permissionGroupId } } },
    );

    if (result.modifiedCount === 1) {
      this.auditingService.insertUserAudits({
        actorUserId: loggedUser.userId,
        domainsDiff: [],
        operation: OP.Update,
        permissionGroupDiff: { newPermissionGroups: [], deletedPermissionGroups: [permissionGroupId] },
        permissionTablesDiff: [],
        resource_id: userObjId,
        userAttributesDiff: [],
      });
      this.userService.invalidateUsersDictCache();
    }
  }

  async getUsersByPermissionGroup(permissionGroup: ObjectId): Promise<GetUsersByPermissionGroup[]> {
    const users = await this.userModel.find({ "permission_groups.id": permissionGroup }).exec();

    const usersDto = users.map<GetUsersByPermissionGroup>((user) => {
      const permission_group = user.permission_groups.find(({ id }) => id.equals(permissionGroup));

      if (!permission_group) {
        throw new InternalServerErrorException(
          `Permission group with id ${permissionGroup} not found in user ${user.user_id} permission groups`,
        );
      }

      return {
        _id: user._id,
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        given_by: userIdSchema.parse(permission_group.given_by),
        registration_date: permission_group.registration_date,
      };
    });

    return usersDto;
  }

  async getLoggedUserGroupPermissions(loggedUser: LoggedUser, permissionGroupId: ObjectId): Promise<GetLoggedUserGroupPermissionsDto> {
    const relations = [
      FGAPermission_groupRelationConstants.can_update_details,
      FGAPermission_groupRelationConstants.can_add_co_owner,
      FGAPermission_groupRelationConstants.can_delete_co_owner,
      FGAPermission_groupRelationConstants.can_change_owner,
    ] as const satisfies FGAPermission_groupRelations[];

    const request: ClientBatchCheckRequest = {
      checks: relations.map((relation) => ({
        user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
        relation,
        object: formatFGAObjectId({
          type: "permission_group",
          id: permissionGroupId.toString(),
        }),
      })),
    };

    const response = await this.openFgaService.batchCheck(request);
    return response.result.reduce(
      (acc, cur) => {
        const relName = cur.request.relation as (typeof relations)[number];
        acc[relName] = cur.allowed ?? false;
        return acc;
      },
      {} as Record<(typeof relations)[number], boolean>,
    );
  }

  async getMemberEditablePermissionGroups(loggedUser: LoggedUser): Promise<ObjectIdBrand[]> {
    const { objects } = await this.openFgaService.listObjects({
      user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
      relation: FGAPermission_groupRelationConstants.can_change_users,
      type: "permission_group",
    });

    const permissionGroupIds = objects.map((permissionGroupObject) => {
      const permissionGroupId = parseFGAObjectId(permissionGroupObject)?.id;

      if (!permissionGroupId) {
        throw new InternalServerErrorException(`Invalid permission group object in openfga ${permissionGroupObject}`);
      }
      return toMongoObjectId(permissionGroupId);
    });

    const permissionGroups = await this.getPermissionGroupsByIds(permissionGroupIds);

    const allowedPermissionGroupIds: ObjectIdBrand[] = [];

    await Promise.all(
      permissionGroups.map(async (permissionGroup) => {
        if (await this.checkHasPermissionGroupDataPermissions(loggedUser.userId, permissionGroup, { throw: false })) {
          allowedPermissionGroupIds.push(permissionGroup._id.toString() as ObjectIdBrand);
        }
      }),
    );

    return allowedPermissionGroupIds;
  }

  async getPermissionGroupDataPermissionsDtoById(groupId: ObjectId): Promise<ZGetPermissionGroupDataPermissionsDto> {
    const result = await this.permissionGroupModel
      .aggregate<ZGetPermissionGroupDataPermissionsDto>([{ $match: { _id: groupId } }, ...GET_PERMISSION_GROUP_DATA_PERMISSIONS_DTO_AGG])
      .exec();

    const dataPermissions = result[0];

    if (!dataPermissions) {
      throw new NotFoundException(`Could not find data permissions for permission group with id ${groupId}`);
    }

    return dataPermissions;
  }

  async getPermissionGroupPermissionDataDtosByIds(groupIds: ObjectId[]): Promise<ZGetPermissionGroupsDataPermissionsResDto> {
    if (groupIds.length === 0) {
      return [];
    }

    const result = await this.permissionGroupModel
      .aggregate<
        ZGetPermissionGroupsDataPermissionsResDto[number]
      >([{ $match: { _id: { $in: groupIds } } }, ...GET_PERMISSION_GROUP_DATA_PERMISSIONS_DTO_AGG])
      .exec();

    return result;
  }

  /**
   * @throws {NotFoundException}
   */
  async editPermissionGroupDataPermissionsById(
    groupId: ObjectId,
    editData: ZEditPermissionGroupDataPermissionsDto,
    loggedUserId: UserID,
  ): Promise<ZEditPermissionGroupDataPermissionsResDto> {
    const uneditedPermissionGroupData = await this.getPermissionGroupById(groupId);

    if (!uneditedPermissionGroupData) {
      throw new NotFoundException(`Could not find permission group with id ${groupId}`);
    }

    const domainsDiff = getDomainsDiffServer(uneditedPermissionGroupData.domains, editData.domains, {
      splitClassifications: false,
      returnDeletedClassifications: false,
    });

    await Promise.all([
      this.userService.assertHasPermissionsForSimpleAttributes(
        loggedUserId,
        editData.attributes,
        editData.domains,
        uneditedPermissionGroupData.attributes,
      ),
      this.assertCanUpdatePermissionGroup(loggedUserId, groupId),
      this.userService.checkPermissionForDomains(loggedUserId, domainsDiff, {
        message: (domainId: string) => `
        User ${loggedUserId} is not allowed to edit permission group with id ${groupId.toString()}:
         has no permission to the domain with id ${domainId}`,
        throw: true,
      }),
    ]);

    const editPermissionTableIds = editData.permission_tables.map(({ id }) => id);
    const permissionTables = await this.permissionTableService.getPermissionTablesByIds(editPermissionTableIds, {
      throwIfNotAllFound: true,
    });

    const populatedPermissionTables = this.userService.populatePermissionTables(editData.permission_tables, permissionTables);

    this.userService.assertUserPermissionTablesValid(populatedPermissionTables);
    const mergedPermissionTables = this.userService.mergePermissionTables(
      populatedPermissionTables,
      uneditedPermissionGroupData.permission_tables,
    );

    const permissionTablesWithNewRowFilterValues: MergedPermissionTable[] = mergedPermissionTables.filter((mergedPermissionTable) => {
      return mergedPermissionTable.row_filters.some((row_filter) => {
        return row_filter.values.some((value) => value.isNew);
      });
    });

    const permissionGroupPermissionTables = await this.userService.mergeRowFilterValuesWithTrinoValues({
      isCreate: false,
      permissionTables: mergedPermissionTables,
      permissionTablesWithNewRowFilterValues,
    });

    const now = new Date();
    const updatedPermissionTables = this.userService.addAuditMetaDataUserPermissionTables(
      loggedUserId,
      now,
      permissionGroupPermissionTables,
      uneditedPermissionGroupData.permission_tables,
    );

    const finalDomainsDiff = getDomainsDiffServer(uneditedPermissionGroupData.domains, editData.domains, {
      splitClassifications: true,
      returnDeletedClassifications: true,
    });

    const updatedDomains = this.userService.addAuditMetaDataUserDomains(
      editData.domains,
      uneditedPermissionGroupData.domains,
      finalDomainsDiff,
      loggedUserId,
      now,
    );

    const updateData: Pick<MongoosePermissionGroup, "permission_tables" | "domains" | "attributes"> = {
      attributes: editData.attributes,
      domains: updatedDomains,
      permission_tables: updatedPermissionTables,
    };
    await this.permissionGroupModel.updateOne(
      { _id: groupId },
      {
        $set: updateData,
      },
    );

    this.userService.invalidateUsersDictCache();

    const permissionTablesDiff = getPermissionTablesDiffServer(uneditedPermissionGroupData.permission_tables, updateData.permission_tables);
    const attributesDiff = getUserIndicationsDiff({
      newUserAttributes: editData.attributes,
      currUserAttributes: uneditedPermissionGroupData.attributes,
    });

    this.auditingService.insertPermissionGroupDataPermissionsAudits({
      actorUserId: loggedUserId,
      operation: OP.Update,
      resource_id: groupId,
      domainsDiff: finalDomainsDiff,
      permissionTablesDiff,
      attributesDiff,
    });

    const updatedDataPermissions = await this.getPermissionGroupDataPermissionsDtoById(groupId);

    return updatedDataPermissions;
  }
}
