import { UserID } from "@port/common-schemas";
import { ApplicationUserAuditLog, ApplicationUserIndicationDiff, OP, Resource, TableDiff } from "@port/shield-models";
import { UserAttributesDiff } from "@port/shield-utils";
import { Difference } from "microdiff";
import mongoose from "mongoose";
import { ApplicationUserDomainDiffResult } from "src/application_users/application_users.interfaces";
import { PermissionGroupDiff } from "src/permission_groups/permission_groups.interface";
import { PermissionTableDiffServer, SplitedDomainDiffServer } from "src/user/user.interfaces";

interface AuditDocumentBase {
  user_id: UserID;
  operation: OP;
  resource: Resource;
  status: "success" | "error";
  resource_info: { id: number | string; name: string };
  message: string;
  response_error_message?: string;
  difference?: Difference[];
}

type AuditDocumentStatus =
  | {
      status: "success";
      difference: Difference[];
    }
  | {
      status: "error";
      response_error_message: string;
      message: string;
    };

export type InsertAuditDocument = AuditDocumentBase & AuditDocumentStatus;

export type AuditDocument = InsertAuditDocument & { time: string };

export type InsertUserAudit = {
  actorUserId: UserID;
  operation: OP;
  resource_id: mongoose.Types.ObjectId;
  domainsDiff: SplitedDomainDiffServer[];
  permissionTablesDiff: PermissionTableDiffServer[];
  userAttributesDiff: UserAttributesDiff[];
  permissionGroupDiff: PermissionGroupDiff;
};

export type InsertDataPermissionsAudit = {
  actorUserId: UserID;
  operation: OP.Update;
  resource_id: mongoose.Types.ObjectId;
  domainsDiff: SplitedDomainDiffServer[];
  permissionTablesDiff: PermissionTableDiffServer[];
  attributesDiff: UserAttributesDiff[];
};

export type InsertTableAudit = {
  user_id: UserID;
  operation: OP.Create | OP.Update;
  table_id: mongoose.Types.ObjectId;
  tableDiff: TableDiff[];
};

export type InsertApplicationUserAudit = {
  actorUserId: UserID;
  resourceId: mongoose.Types.ObjectId;
  operation: OP.Create | OP.Update | OP.Delete;
  domainsDiff: ApplicationUserDomainDiffResult[];
  applicationUserIndicationsDiff: ApplicationUserIndicationDiff[];
  metadata: ApplicationUserAuditLog["metadata"];
};

export const AUDITING_UNKNOWN = "--unknown--";
