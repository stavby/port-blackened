import { z } from "zod";
import { permissionGroupSchema } from "./base/permission_groups.ts";
import { editUserSchema, getUserRowFilterSchema, getUserSchema } from "./users.dto.ts";

export const PermissionGroupsDtoSchema = permissionGroupSchema
  .pick({
    _id: true,
    name: true,
    description: true,
    color: true,
    ownerId: true,
    ownerName: true,
    coOwners: true,
  })
  .extend({
    can_delete: z.boolean(),
  });
export type PermissionGroupsDto = z.infer<typeof PermissionGroupsDtoSchema>;

export const CreatePermissionGroupDtoSchema = permissionGroupSchema.pick({
  name: true,
  description: true,
});
export type CreatePermissionGroupDto = z.infer<typeof CreatePermissionGroupDtoSchema>;

export const editPermissionGroupDetailsDtoSchema = permissionGroupSchema.pick({
  name: true,
  description: true,
  ownerId: true,
  ownerName: true,
  coOwners: true,
});
export type EditPermissionGroupDetailsDto = z.infer<typeof editPermissionGroupDetailsDtoSchema>;

export const LoggedUserGroupPermissionsSchema = z.object({
  can_update_details: z.boolean(),
  can_add_co_owner: z.boolean(),
  can_delete_co_owner: z.boolean(),
  can_change_owner: z.boolean(),
});
export type GetLoggedUserGroupPermissionsDto = z.infer<typeof LoggedUserGroupPermissionsSchema>;

export const getPermissionGroupDataPermissionsSchema = getUserSchema
  .pick({ permission_tables: true })
  .merge(permissionGroupSchema.pick({ attributes: true, _id: true, name: true }))
  .extend({
    domains: getUserSchema.shape.domains.element
      .omit({ given_by: true, last_changed_by: true })
      .merge(permissionGroupSchema.shape.domains.element.pick({ given_by: true, last_changed_by: true }))
      .array(),
  });

export type GetPermissionGroupDataPermissionsDto = z.infer<typeof getPermissionGroupDataPermissionsSchema>;

export const getPermissionGroupsDataPermissionsReqSchema = z.object({
  permissionGroupIds: permissionGroupSchema.shape._id.array(),
});

export type GetPermissionGroupsDataPermissionsReqDto = z.infer<typeof getPermissionGroupsDataPermissionsReqSchema>;

export const getPermissionGroupsDataPermissionsResSchema = getPermissionGroupDataPermissionsSchema.array();

export type GetPermissionGroupsDataPermissionsResDto = z.infer<typeof getPermissionGroupsDataPermissionsResSchema>;

export const editPermissionGroupPermissionsSchema = editUserSchema
  .pick({ domains: true, permission_tables: true })
  .merge(permissionGroupSchema.pick({ attributes: true }));

export type EditPermissionGroupPermissionsDto = z.infer<typeof editPermissionGroupPermissionsSchema>;

export const editPermissionGroupDataPermissionsResSchema = getPermissionGroupDataPermissionsSchema;

export type EditPermissionGroupPermissionsResDto = z.infer<typeof editPermissionGroupPermissionsSchema>;
