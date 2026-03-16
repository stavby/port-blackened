import { ChipItem } from "@components/ManageUserPopup/OverflowChipList";
import { TUserDomainListItem } from "@components/ManageUserPopup/UserDomains";
import { UserID } from "@port/common-schemas";
import {
  CreateUserDto,
  DomainWithClassificationsDto,
  FilterUserOptions,
  GetUsersResponseDto,
  ObjectIdBrand,
  PermissionGroup,
  PermissionGroupsDto,
} from "@port/shield-schemas";
import { MergedUser, PermissionSource } from "@port/shield-utils";

export type UserDto = GetUsersResponseDto["users"][number];

export type UserDomainDto = UserDto["domains"][number];
export type UserPermissionTableDto = UserDto["permission_tables"][number];
export type UserPermissionGroupDto = UserDto["permission_groups"][number];
export type UserRowFilterDto = UserPermissionTableDto["row_filters"][number];
export type UserRowFilterValueDto = UserRowFilterDto["values"][number];

export type MergedClientUser = Omit<MergedUser, "permission_groups"> & {
  permission_groups: Pick<MergedUser["permission_groups"][number], "_id" | "name" | "color">[];
};

export type UserDomain = MergedClientUser["domains"][number];
export type UserPermissionTable = MergedClientUser["permission_tables"][number];
export type UserPermissionGroup = MergedClientUser["permission_groups"][number];
export type UserRowFilter = UserPermissionTable["row_filters"][number];
export type UserRowFilterValue = UserRowFilter["values"][number];

export type EditUserDto = Pick<CreateUserDto, "attributes" | "domains" | "permission_tables" | "permission_groups" | "is_read_all">;

export type GetUserInfoDto = {
  user_id: UserID;
  first_name?: string;
  last_name?: string;
};

export interface FullUserInfo extends GetUserInfoDto {
  shem_yechida?: string;
  shem_darga?: string;
  shem_sug_sherut?: string;
  cell_phone?: string;
  tatash_date?: Date;
  sabat?: number;
  shem_isuk?: string;
}

export type GetUsersByPermissionGroup = {
  given_by: string;
  registration_date: Date;
} & Pick<UserDto, "user_id" | "first_name" | "last_name" | "_id">;

export type FilterUsersInput = Partial<{
  domains: (DomainWithClassificationsDto & {
    selectedClassifications?: UserDomainDto["classifications"];
  })[];
  userTypes: string[];
  permissionGroups: PermissionGroupsDto[];
  authorizationSource: string;
  specialProperties: string[];
}>;

export type FilterUsersInputDto = Partial<Record<FilterUserOptions, string>>;
