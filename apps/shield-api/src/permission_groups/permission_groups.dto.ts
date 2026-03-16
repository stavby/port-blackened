import { UserID } from "@port/common-schemas";
import { User } from "@port/shield-models";
import {
  editPermissionGroupDataPermissionsResSchema,
  editPermissionGroupDetailsDtoSchema,
  editPermissionGroupPermissionsSchema,
  getPermissionGroupDataPermissionsSchema,
  getPermissionGroupsDataPermissionsReqSchema,
  getPermissionGroupsDataPermissionsResSchema,
  PermissionGroupsDtoSchema,
} from "@port/shield-schemas";
import { ArrayNotEmpty, ArrayUnique, IsArray } from "class-validator";
import { WithId } from "mongodb";
import { createZodDto } from "nestjs-zod";
import { UserPermissionGroup } from "src/user/user.classes";
import { withObjectIdTransform } from "src/utils/mongo.utils";

export class AddPermissionGroupToUsers {
  @IsArray()
  @ArrayUnique()
  @ArrayNotEmpty()
  users: UserID[];
}

export type GetUsersByPermissionGroup = Omit<UserPermissionGroup, "id"> &
  Pick<WithId<User>, "_id" | "user_id" | "first_name" | "last_name">;

export class ZGetPermissionGroupsDto extends createZodDto(withObjectIdTransform(PermissionGroupsDtoSchema)) {}
export class ZGetPermissionGroupDataPermissionsDto extends createZodDto(withObjectIdTransform(getPermissionGroupDataPermissionsSchema)) {}
export class ZGetPermissionGroupsDataPermissionsReqDto extends createZodDto(
  withObjectIdTransform(getPermissionGroupsDataPermissionsReqSchema),
) {}
export class ZGetPermissionGroupsDataPermissionsResDto extends createZodDto(
  withObjectIdTransform(getPermissionGroupsDataPermissionsResSchema),
) {}
export class ZEditPermissionGroupDetailsPermissionsDto extends createZodDto(editPermissionGroupDetailsDtoSchema) {}

export class ZEditPermissionGroupDataPermissionsDto extends createZodDto(withObjectIdTransform(editPermissionGroupPermissionsSchema)) {}
export class ZEditPermissionGroupDataPermissionsResDto extends createZodDto(
  withObjectIdTransform(editPermissionGroupDataPermissionsResSchema),
) {}
