import { PermissionGroup, RowFilterValueType } from "@port/shield-models";
import { DomainDiff, PermissionTableDiff, SplitedDomainDiff } from "@port/shield-utils";
import mongoose from "mongoose";
import { Domain } from "src/domains/domains.dto";
import { RowFilter } from "src/permission_tables/permission_tables.classes";
import { User, UserAttributes, UserDomain, UserPermissionTable } from "./user.classes";
import { ZCreateUserDto, ZEditUserDto, ZEditUserResDto, ZGetUserDto } from "./users.dto";
import { WithId } from "mongodb";

export type SplitedDomainDiffServer = SplitedDomainDiff<
  mongoose.Types.ObjectId,
  Pick<UserDomain, "id" | "classifications">,
  Pick<UserDomain, "id" | "classifications">
>;

export type DomainDiffServer = DomainDiff<
  mongoose.Types.ObjectId,
  Pick<UserDomain, "id" | "classifications" | "last_changed_by">,
  Pick<UserDomain, "id" | "classifications">
>;

export type PermissionTableDiffServer = PermissionTableDiff<
  mongoose.Types.ObjectId,
  Pick<UserPermissionTable, "id" | "row_filters">,
  Pick<UserPermissionTable, "id" | "row_filters">
>;

type EditUserDtoPermissionTable = ZEditUserDto["permission_tables"][number];
type EditUserDtoRowFilter = EditUserDtoPermissionTable["row_filters"][number];

export type PopulatedUserPermissionTable = Omit<EditUserDtoPermissionTable, "row_filters"> & {
  row_filters: (EditUserDtoRowFilter & Omit<RowFilter, keyof EditUserDtoRowFilter>)[];
};

export type MergedPermissionTable = Omit<PopulatedUserPermissionTable, "row_filters"> & {
  row_filters: (Omit<PopulatedUserPermissionTable["row_filters"][number], "values"> & {
    values: { value: RowFilterValueType; display_name: string | null; isNew: boolean }[];
  })[];
};

export type UserExcel = Pick<User, "user_id"> &
  Pick<UserAttributes, "type"> & {
    full_name: string;
    mask: string;
    unique_population?: string | undefined;
    deceased_population?: string;
    domain_display_name: Domain["display_name"];
    classifications: string;
    given_by: string;
    create_date: string;
    last_changed_by: string;
    last_change: string;
  };

export type CreateUserDtoAttributes = ZCreateUserDto["attributes"];
export type CreateUserDtoDomain = ZCreateUserDto["domains"][number];
export type CreateUserDtoPermissionTable = ZCreateUserDto["permission_tables"][number];
export type CreateUserDtoRowFilter = CreateUserDtoPermissionTable["row_filters"][number];

export type GetUserDtoDomain = ZGetUserDto["domains"][number];
export type GetUserDtoPermissionTable = ZGetUserDto["permission_tables"][number];
export type GetUserDtoPermissionGroup = ZGetUserDto["permission_groups"][number];

export type LockedDomain = ZEditUserResDto["lockedDomains"][number];
export type GetDictUserDtoAggResult = Pick<User, "user_id" | "catalogs"> & {
  permission_tables: ZGetUserDto["permission_tables"];
  // key: domain id
  domains: User["domains"];
  attributes: UserAttributes;
  permission_groups: (WithId<Pick<PermissionGroup, "attributes" | "domains" | "name">> & Pick<ZGetUserDto, "permission_tables">)[];
};
