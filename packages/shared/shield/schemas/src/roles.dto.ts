import z from "zod";
import { NON_ADMIN_ROLE_NAME_ENUM, objectIdStringSchema } from "./consts.ts";

const baseRole = z.object({
  _id: objectIdStringSchema(),
  name: NON_ADMIN_ROLE_NAME_ENUM,
  display_name: z.string().nonempty(),
  color: z.string().nonempty(),
});

export const getRolesDto = baseRole.array();

export type GetRolesDto = z.infer<typeof getRolesDto>;

export const getRolesFgaPermissionMappingDto = z
  .object({
    categoryName: z.string().nonempty(),
    categoryDisplayName: z.string().nonempty(),
    fgaPermissions: z.object({ name: z.string(), displayName: z.string(), roles: NON_ADMIN_ROLE_NAME_ENUM.array() }).array(),
  })
  .array();

export type GetRolesFgaPermissionMappingDto = z.infer<typeof getRolesFgaPermissionMappingDto>;
