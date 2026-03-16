import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  APPLICATION_USER_DIFF_VERSION_BY_KIND,
  ApplicationUserAuditLog,
  ApplicationUserClassificationDiff,
  ApplicationUserDomainDiff,
  ApplicationUserIndicationDiff,
  ApplicationUserRoleDiff,
  AuditLog,
  CURRENT_AUDIT_LOG_V,
  PermissionGroupDataPermissionsAuditLog,
  Resource,
  TABLE_DIFF_VERSION_BY_KIND,
  TableAuditLog,
  TableDiff,
  USER_DIFF_VERSION_BY_KIND,
  UserAuditLog,
  UserClassificationDiff,
  UserDomainDiff,
  UserPermissionGroupDiff,
  UserPermissionTableDiff,
  UserRowFilterValueDiff,
  VersionedApplicationUserDiff,
  VersionedUserDiff,
  WithVersion,
} from "@port/shield-models";
import { UserAttributesDiff } from "@port/shield-utils";
import { Collection, Db } from "mongodb";
import { Model } from "mongoose";
import { ApplicationUserDomainDiffResult } from "src/application_users/application_users.interfaces";
import { PermissionGroupDiff } from "src/permission_groups/permission_groups.interface";
import { PermissionTableDiffServer, SplitedDomainDiffServer } from "src/user/user.interfaces";
import { DB_CONNECTION_PROVIDER } from "src/utils/constants";
import {
  AuditDocument,
  InsertApplicationUserAudit,
  InsertAuditDocument,
  InsertDataPermissionsAudit,
  InsertTableAudit,
  InsertUserAudit,
} from "./auditing.types";

@Injectable()
class AuditingService {
  private readonly logger: Logger;
  /**@deprecated */
  private readonly collection: Collection<AuditDocument>;

  constructor(
    @Inject(DB_CONNECTION_PROVIDER) db: Db,
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLog>,
  ) {
    this.logger = new Logger(AuditingService.name);
    this.collection = db.collection<AuditDocument>("auditing");
  }

  async insertLegacyAudit(...data: InsertAuditDocument[]) {
    try {
      await this.collection.insertMany(data.map((doc) => ({ ...doc, time: new Date().toISOString() })));
    } catch (error) {
      this.logger.error(new Error("Failed to insert legacy audit", { cause: error }));
    }
  }

  private formatAttributesDiff(userAttributesDiff: UserAttributesDiff[]) {
    const versionedUserAttributesDiff: Extract<VersionedUserDiff, Pick<UserAttributesDiff, "kind">>[] = [];

    userAttributesDiff.forEach((diff) => {
      versionedUserAttributesDiff.push({ ...diff, version: USER_DIFF_VERSION_BY_KIND[diff.kind] });
    });

    return versionedUserAttributesDiff;
  }

  private flattenPermissionTablesDiff(permissionTableDiffs: PermissionTableDiffServer[]) {
    const flattenedPermissionTablesDiff: WithVersion<UserPermissionTableDiff, (typeof USER_DIFF_VERSION_BY_KIND)["permission_table"]>[] =
      [];
    const flattenedRowFilterValuesDiffs: WithVersion<UserRowFilterValueDiff, (typeof USER_DIFF_VERSION_BY_KIND)["row_filter_value"]>[] = [];

    permissionTableDiffs.forEach((permissionTableDiff) => {
      if (permissionTableDiff.diffType === "new") {
        flattenedPermissionTablesDiff.push({
          kind: "permission_table",
          type: "new",
          permission_table_id: permissionTableDiff.id,
          version: USER_DIFF_VERSION_BY_KIND["permission_table"],
        });
      } else if (permissionTableDiff.diffType === "deleted") {
        flattenedPermissionTablesDiff.push({
          kind: "permission_table",
          type: "deleted",
          permission_table_id: permissionTableDiff.id,
          version: USER_DIFF_VERSION_BY_KIND["permission_table"],
        });
      }

      permissionTableDiff.row_filters.forEach((rowFilter) => {
        rowFilter.newValues.forEach((value) => {
          flattenedRowFilterValuesDiffs.push({
            kind: "row_filter_value",
            type: "new",
            permission_table_id: permissionTableDiff.id,
            row_filter_kod: rowFilter.kod,
            row_filter_value: value.value,
            version: USER_DIFF_VERSION_BY_KIND["row_filter_value"],
          });
        });

        rowFilter.deletedValues.forEach((value) => {
          flattenedRowFilterValuesDiffs.push({
            kind: "row_filter_value",
            type: "deleted",
            permission_table_id: permissionTableDiff.id,
            row_filter_kod: rowFilter.kod,
            row_filter_value: value.value,
            version: USER_DIFF_VERSION_BY_KIND["row_filter_value"],
          });
        });
      });
    });

    return { flattenedPermissionTablesDiff, flattenedRowFilterValuesDiffs };
  }

  private flattenDomainsDiff(domainDiffs: SplitedDomainDiffServer[]) {
    const flattenedDomainDiffs: WithVersion<UserDomainDiff, (typeof USER_DIFF_VERSION_BY_KIND)["domain"]>[] = [];
    const flattenedClassificationDiffs: WithVersion<UserClassificationDiff, (typeof USER_DIFF_VERSION_BY_KIND)["classification"]>[] = [];

    domainDiffs.forEach((domainDiff) => {
      if (domainDiff.diffType === "new") {
        flattenedDomainDiffs.push({
          kind: "domain",
          type: "new",
          domain_id: domainDiff.id,
          version: USER_DIFF_VERSION_BY_KIND["domain"],
        });

        domainDiff.classifications.forEach((classification) => {
          flattenedClassificationDiffs.push({
            kind: "classification",
            type: "new",
            domain_id: domainDiff.id,
            classification,
            version: USER_DIFF_VERSION_BY_KIND["classification"],
          });
        });
      } else if (domainDiff.diffType === "updated") {
        domainDiff.newClassifications.forEach((classification) => {
          flattenedClassificationDiffs.push({
            kind: "classification",
            type: "new",
            domain_id: domainDiff.id,
            classification,
            version: USER_DIFF_VERSION_BY_KIND["classification"],
          });
        });

        domainDiff.deletedClassifications.forEach((classification) => {
          flattenedClassificationDiffs.push({
            kind: "classification",
            type: "deleted",
            domain_id: domainDiff.id,
            classification,
            version: USER_DIFF_VERSION_BY_KIND["classification"],
          });
        });
      } else if (domainDiff.diffType === "deleted") {
        flattenedDomainDiffs.push({
          kind: "domain",
          type: "deleted",
          domain_id: domainDiff.id,
          version: USER_DIFF_VERSION_BY_KIND["domain"],
        });

        domainDiff.classifications.forEach((classification) => {
          flattenedClassificationDiffs.push({
            kind: "classification",
            type: "deleted",
            domain_id: domainDiff.id,
            classification,
            version: USER_DIFF_VERSION_BY_KIND["classification"],
          });
        });
      }
    });

    return { flattenedDomainDiffs, flattenedClassificationDiffs };
  }

  private flattenApplicationUserDomainsDiff(domainDiffs: ApplicationUserDomainDiffResult[]) {
    const applicationUserDomainDiffs: WithVersion<ApplicationUserDomainDiff, (typeof APPLICATION_USER_DIFF_VERSION_BY_KIND)["domain"]>[] =
      [];
    const applicationUserClassificationDiffs: WithVersion<
      ApplicationUserClassificationDiff,
      (typeof APPLICATION_USER_DIFF_VERSION_BY_KIND)["classification"]
    >[] = [];
    const applicationUserRoleDiffs: WithVersion<ApplicationUserRoleDiff, (typeof APPLICATION_USER_DIFF_VERSION_BY_KIND)["role"]>[] = [];

    domainDiffs.forEach((domainDiff) => {
      if (domainDiff.diffType === "new" || domainDiff.diffType === "deleted") {
        applicationUserDomainDiffs.push({
          domain_id: domainDiff.id,
          kind: "domain",
          type: domainDiff.diffType,
          version: APPLICATION_USER_DIFF_VERSION_BY_KIND["domain"],
        });
      }

      domainDiff.newClassifications.forEach((classification) => {
        applicationUserClassificationDiffs.push({
          kind: "classification",
          type: "new",
          domain_id: domainDiff.id,
          classification,
          version: APPLICATION_USER_DIFF_VERSION_BY_KIND["classification"],
        });
      });

      domainDiff.deletedClassifications.forEach((classification) => {
        applicationUserClassificationDiffs.push({
          kind: "classification",
          type: "deleted",
          domain_id: domainDiff.id,
          classification,
          version: APPLICATION_USER_DIFF_VERSION_BY_KIND["classification"],
        });
      });

      domainDiff.newRoles.forEach((role) => {
        applicationUserRoleDiffs.push({
          kind: "role",
          type: "new",
          domain_id: domainDiff.id,
          role: role.id,
          version: APPLICATION_USER_DIFF_VERSION_BY_KIND["role"],
        });
      });

      domainDiff.deletedRoles.forEach((role) => {
        applicationUserRoleDiffs.push({
          kind: "role",
          type: "deleted",
          domain_id: domainDiff.id,
          role: role.id,
          version: APPLICATION_USER_DIFF_VERSION_BY_KIND["role"],
        });
      });
    });

    return {
      applicationUserDomainDiffs,
      applicationUserClassificationDiffs,
      applicationUserRoleDiffs,
    };
  }
  formatPermissionGroupsDiff(permissionGroupDiff: PermissionGroupDiff) {
    const diffArray: WithVersion<UserPermissionGroupDiff, (typeof USER_DIFF_VERSION_BY_KIND)["permission_group"]>[] = [];

    permissionGroupDiff.newPermissionGroups.forEach((newGroup) => {
      diffArray.push({
        kind: "permission_group",
        type: "new",
        permission_group_id: newGroup,
        version: USER_DIFF_VERSION_BY_KIND["permission_group"],
      });
    });

    permissionGroupDiff.deletedPermissionGroups.forEach((deletedGroup) => {
      diffArray.push({
        kind: "permission_group",
        type: "deleted",
        permission_group_id: deletedGroup,
        version: USER_DIFF_VERSION_BY_KIND["permission_group"],
      });
    });

    return diffArray;
  }

  async insertUserAudits(...data: InsertUserAudit[]) {
    const time = new Date();
    const insertData: UserAuditLog[] = data.map(
      ({ actorUserId, operation, resource_id, domainsDiff, permissionTablesDiff, userAttributesDiff, permissionGroupDiff }) => {
        const { flattenedClassificationDiffs, flattenedDomainDiffs } = this.flattenDomainsDiff(domainsDiff);
        const { flattenedPermissionTablesDiff, flattenedRowFilterValuesDiffs } = this.flattenPermissionTablesDiff(permissionTablesDiff);
        const formattedUserAttributesDiff = this.formatAttributesDiff(userAttributesDiff);
        const formattedUserPermissionGroupDiff = this.formatPermissionGroupsDiff(permissionGroupDiff);

        const difference: UserAuditLog["difference"] = [
          ...formattedUserAttributesDiff,
          ...flattenedDomainDiffs,
          ...flattenedClassificationDiffs,
          ...flattenedPermissionTablesDiff,
          ...flattenedRowFilterValuesDiffs,
          ...formattedUserPermissionGroupDiff,
        ];

        return {
          user_id: actorUserId,
          operation,
          resource_id,
          resource_type: Resource.User,
          difference,
          time,
          version: CURRENT_AUDIT_LOG_V,
        };
      },
    );

    try {
      await this.auditModel.insertMany(insertData);
    } catch (error) {
      this.logger.error(new Error("Failed to insert user audit logs", { cause: error }));
    }
  }

  async insertPermissionGroupDataPermissionsAudits(...data: InsertDataPermissionsAudit[]) {
    const time = new Date();
    const insertData: PermissionGroupDataPermissionsAuditLog[] = data.map(
      ({ actorUserId, operation, resource_id, domainsDiff, permissionTablesDiff, attributesDiff }) => {
        const { flattenedClassificationDiffs, flattenedDomainDiffs } = this.flattenDomainsDiff(domainsDiff);
        const { flattenedPermissionTablesDiff, flattenedRowFilterValuesDiffs } = this.flattenPermissionTablesDiff(permissionTablesDiff);
        const formattedUserAttributesDiff = this.formatAttributesDiff(attributesDiff);

        const difference: PermissionGroupDataPermissionsAuditLog["difference"] = [
          ...formattedUserAttributesDiff,
          ...flattenedDomainDiffs,
          ...flattenedClassificationDiffs,
          ...flattenedPermissionTablesDiff,
          ...flattenedRowFilterValuesDiffs,
        ];

        return {
          user_id: actorUserId,
          operation,
          resource_id,
          resource_type: Resource.PermissionGroup,
          difference,
          time,
          version: CURRENT_AUDIT_LOG_V,
        };
      },
    );

    try {
      await this.auditModel.insertMany(insertData);
    } catch (error) {
      this.logger.error(new Error("Failed to insert user audit logs", { cause: error }));
    }
  }

  async insertApplicationUserAudits(...data: InsertApplicationUserAudit[]) {
    const time = new Date();
    const insertData: ApplicationUserAuditLog[] = data.map((applicationUserInsertData) => {
      const { applicationUserClassificationDiffs, applicationUserDomainDiffs, applicationUserRoleDiffs } =
        this.flattenApplicationUserDomainsDiff(applicationUserInsertData.domainsDiff);

      const formattedApplicationUserIndicationsDiff: Extract<VersionedApplicationUserDiff, Pick<ApplicationUserIndicationDiff, "kind">>[] =
        applicationUserInsertData.applicationUserIndicationsDiff.map((diff) => ({
          ...diff,
          version: APPLICATION_USER_DIFF_VERSION_BY_KIND[diff.kind],
        }));

      return {
        user_id: applicationUserInsertData.actorUserId,
        operation: applicationUserInsertData.operation,
        resource_id: applicationUserInsertData.resourceId,
        resource_type: Resource.ApplicationUser,
        difference: [
          ...applicationUserDomainDiffs,
          ...applicationUserClassificationDiffs,
          ...applicationUserRoleDiffs,
          ...formattedApplicationUserIndicationsDiff,
        ],
        time,
        version: CURRENT_AUDIT_LOG_V,
        metadata: applicationUserInsertData.metadata,
      };
    });

    try {
      await this.auditModel.insertMany(insertData);
    } catch (error) {
      this.logger.error(new Error("Failed to insert application users audit logs", { cause: error }));
    }
  }

  async insertTableAudits(...data: InsertTableAudit[]) {
    const time = new Date();
    const insertData: TableAuditLog[] = data.map((table) => ({
      user_id: table.user_id,
      operation: table.operation,
      resource_id: table.table_id,
      resource_type: Resource.Table,
      difference: table.tableDiff.map<WithVersion<TableDiff, (typeof TABLE_DIFF_VERSION_BY_KIND)[keyof typeof TABLE_DIFF_VERSION_BY_KIND]>>(
        (diff) => {
          const version = TABLE_DIFF_VERSION_BY_KIND[diff.kind];

          return {
            ...diff,
            version,
          };
        },
      ),
      time,
      version: CURRENT_AUDIT_LOG_V,
    }));

    try {
      await this.auditModel.insertMany(insertData);
    } catch (error) {
      this.logger.error(new Error("Failed to insert table audit logs", { cause: error }));
    }
  }
}

export default AuditingService;
