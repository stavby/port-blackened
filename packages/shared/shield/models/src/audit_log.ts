import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { OP, Resource } from "./auditing";
import { ColumnAttributes } from "./table";
import { UserAttributes, UserRowFilter, UserRowFilterValue } from "./user";
import { ApplicationUser } from "./application_user";

export const CURRENT_AUDIT_LOG_V = 1;

export type BaseTableDiff = {
  column_name: string;
};

export type ClassificationTableDiff = BaseTableDiff & {
  kind: "classification";
  oldValue: ColumnAttributes["classification"] | null;
  newValue: ColumnAttributes["classification"] | null;
};

export type MaskTableDiff = BaseTableDiff & {
  kind: "mask";
  oldValue: ColumnAttributes["mask"] | null;
  newValue: ColumnAttributes["mask"] | null;
};

export type ColumnDictDiff = ClassificationTableDiff | MaskTableDiff;

export type TableDomainDiff = {
  kind: "domain";
  oldValue: mongoose.Types.ObjectId | null;
  newValue: mongoose.Types.ObjectId | null;
};

export type TablePermissionTableDiff = {
  kind: "permission_table";
  oldValue: mongoose.Types.ObjectId | null;
  newValue: mongoose.Types.ObjectId | null;
};

export type TableAuthKeyDiff = {
  kind: "auth_key";
  oldValue: string | null;
  newValue: string | null;
};

export type TableAuthColumnDiff = {
  kind: "auth_column";
  oldValue: string | null;
  newValue: string | null;
};

export type TableVerificationStageDiff = {
  kind: "verification_stages";
  stage: string;
  action: "checked" | "unchecked";
};

export type TableFullVerificationDiff = {
  kind: "full_verification";
  oldValue: boolean;
  newValue: boolean;
};

export type TableDiff =
  | ColumnDictDiff
  | TableDomainDiff
  | TablePermissionTableDiff
  | TableAuthKeyDiff
  | TableAuthColumnDiff
  | TableVerificationStageDiff
  | TableFullVerificationDiff;

export const TABLE_DIFF_VERSION_BY_KIND = {
  classification: 1,
  mask: 1,
  domain: 1,
  permission_table: 1,
  auth_key: 1,
  auth_column: 1,
  verification_stages: 1,
  full_verification: 1,
} as const satisfies Record<TableDiff["kind"], number>;

export type VersionedTableDiff = {
  [kind in TableDiff["kind"]]: WithVersion<Extract<TableDiff, { kind: kind }>, (typeof TABLE_DIFF_VERSION_BY_KIND)[kind]>;
}[TableDiff["kind"]];

export type UserDomainDiff = {
  kind: "domain";
  domain_id: mongoose.Types.ObjectId;
  type: "new" | "deleted";
};

export type UserClassificationDiff = {
  kind: "classification";
  type: "new" | "deleted";
  domain_id: mongoose.Types.ObjectId;
  classification: mongoose.Types.ObjectId;
};

export type UserPermissionTableDiff = {
  kind: "permission_table";
  type: "new" | "deleted";
  permission_table_id: mongoose.Types.ObjectId;
};

export type UserRowFilterValueDiff = {
  kind: "row_filter_value";
  type: "new" | "deleted";
  permission_table_id: mongoose.Types.ObjectId;
  row_filter_kod: UserRowFilter["kod"];
  row_filter_value: UserRowFilterValue["value"];
};

export type UserPermissionGroupDiff = {
  kind: "permission_group";
  type: "new" | "deleted";
  permission_group_id: mongoose.Types.ObjectId;
};

type UserIndicationDiffKind = Extract<keyof UserAttributes, "mask" | "deceased_population">;
export type UserIndicationDiff = {
  [kind in UserIndicationDiffKind]: {
    kind: kind;
    action_type: "ON" | "OFF";
  };
}[UserIndicationDiffKind];

export type UserUniquePopulationDiff = {
  kind: "unique_population";
  type: "new" | "deleted";
  value: number;
};

export type UserTypeDiff = {
  kind: "type";
  oldValue: UserAttributes["type"] | null;
  newValue: UserAttributes["type"] | null;
};

export type UserAttributesDiff = UserIndicationDiff | UserUniquePopulationDiff | UserTypeDiff;

export type UserDiff =
  | UserDomainDiff
  | UserClassificationDiff
  | UserPermissionTableDiff
  | UserRowFilterValueDiff
  | UserIndicationDiff
  | UserUniquePopulationDiff
  | UserTypeDiff
  | UserPermissionGroupDiff;

export const USER_DIFF_VERSION_BY_KIND = {
  type: 1,
  classification: 1,
  mask: 1,
  domain: 1,
  permission_table: 1,
  deceased_population: 1,
  row_filter_value: 1,
  unique_population: 1,
  permission_group: 1,
} as const satisfies Record<UserDiff["kind"], number>;

export type VersionedUserDiff = {
  [kind in UserDiff["kind"]]: WithVersion<Extract<UserDiff, { kind: kind }>, (typeof USER_DIFF_VERSION_BY_KIND)[kind]>;
}[UserDiff["kind"]];

export type ApplicationUserDomainDiff = {
  kind: "domain";
  domain_id: mongoose.Types.ObjectId;
  type: "new" | "deleted";
};

export type ApplicationUserClassificationDiff = {
  kind: "classification";
  type: "new" | "deleted";
  domain_id: mongoose.Types.ObjectId;
  classification: mongoose.Types.ObjectId;
};

export type ApplicationUserRoleDiff = {
  kind: "role";
  type: "new" | "deleted";
  domain_id: mongoose.Types.ObjectId;
  role: mongoose.Types.ObjectId;
};

export const applicationUserIndicationDiffKind = [
  "is_admin",
  "can_create_connections",
  "can_manage_unique_population_indications",
] as const satisfies (keyof ApplicationUser)[];

type ApplicationUserIndicationDiffKind = (typeof applicationUserIndicationDiffKind)[number];

export type ApplicationUserIndicationDiff = {
  [kind in ApplicationUserIndicationDiffKind]: {
    kind: kind;
    action_type: "ON" | "OFF";
  };
}[ApplicationUserIndicationDiffKind];

export type ApplicationUserDiff =
  | ApplicationUserDomainDiff
  | ApplicationUserClassificationDiff
  | ApplicationUserRoleDiff
  | ApplicationUserIndicationDiff;

export const APPLICATION_USER_DIFF_VERSION_BY_KIND = {
  classification: 1,
  domain: 1,
  can_create_connections: 1,
  can_manage_unique_population_indications: 1,
  is_admin: 1,
  role: 1,
} as const satisfies Record<ApplicationUserDiff["kind"], number>;

export type VersionedApplicationUserDiff = {
  [kind in ApplicationUserDiff["kind"]]: WithVersion<
    Extract<ApplicationUserDiff, { kind: kind }>,
    (typeof APPLICATION_USER_DIFF_VERSION_BY_KIND)[kind]
  >;
}[ApplicationUserDiff["kind"]];

export type WithVersion<T extends Record<PropertyKey, unknown>, V extends number> = T & { version: V };

export type Difference = VersionedTableDiff[] | VersionedUserDiff[];

@Schema({ collection: "audit_logs" })
export class AuditLog {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true, enum: OP })
  operation: OP;

  @Prop({ required: true, enum: Resource })
  resource_type: Resource;

  @Prop({ required: true })
  resource_id: mongoose.Types.ObjectId;

  @Prop({ required: true, type: [mongoose.Schema.Types.Mixed] })
  difference: Difference;

  @Prop({ required: true, type: Date })
  time: Date;

  @Prop({ required: true, type: Number, enum: [CURRENT_AUDIT_LOG_V] })
  version: typeof CURRENT_AUDIT_LOG_V;

  @Prop({ required: false, type: mongoose.Schema.Types.Mixed })
  metadata?: unknown;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

export type UserAuditLog = Omit<AuditLog, "resource_type" | "difference"> & {
  resource_type: Resource.User;
  difference: VersionedUserDiff[];
};

export type PermissionGroupDataPermissionsAuditLog = Omit<AuditLog, "resource_type" | "difference"> & {
  resource_type: Resource.PermissionGroup;
  difference: VersionedUserDiff[];
};

export type TableAuditLog = Omit<AuditLog, "resource_type" | "difference"> & {
  resource_type: Resource.Table;
  difference: VersionedTableDiff[];
};

export type ApplicationUserAuditLog = Omit<AuditLog, "resource_type" | "difference" | "metadata"> & {
  resource_type: Resource.ApplicationUser;
  difference: VersionedApplicationUserDiff[];
  metadata: { user_id: string };
};

export type TypedAuditLog = UserAuditLog | TableAuditLog;
