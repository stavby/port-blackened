import { AddPath } from "@port/common-schemas";
import {
  CoOwnerSchema,
  CreatePermissionGroupDtoSchema,
  GetPermissionGroupDataPermissionsDto,
  permissionGroupSchema,
} from "@port/shield-schemas";
import { PermissionSource } from "@port/shield-utils";
import { z } from "zod";

export const PermissionGroupFormSchema = permissionGroupSchema
  .pick({
    name: true,
    description: true,
    ownerId: true,
    ownerName: true,
  })
  .extend({
    coOwners: z.array(CoOwnerSchema),
  })
  .superRefine((arg, ctx) => {
    if (arg.coOwners?.some((user) => user.userId === arg.ownerId))
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "אין להזין משתמש גם בבעלות וגם כשותף לבעלות", path: ["coOwners"] });

    if (new Set(arg.coOwners?.map((user) => user.userId)).size !== arg.coOwners?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "המשתמשים צריכים להיות שונים", path: ["coOwners"] });
    }
  });
export type PermissionGroupForm = z.infer<typeof PermissionGroupFormSchema>;

export const INITIAL_EMPTY_PERMISSION_GROUP = CreatePermissionGroupDtoSchema.parse({
  name: "",
  description: "",
});

export type PermissionGroupDataPermissionsDomain = GetPermissionGroupDataPermissionsDto["domains"][number];
export type PermissionGroupDataPermissionsPermissionTable = GetPermissionGroupDataPermissionsDto["permission_tables"][number];

export type FormattedPermissionGroupDomain = AddPath<
  PermissionGroupDataPermissionsDomain & { sources: PermissionSource[] },
  ["classifications", number, "sources"],
  PermissionSource[]
>;
export type FormattedPermissionGroupPermissionTable = AddPath<
  PermissionGroupDataPermissionsPermissionTable,
  ["row_filters", number, "values", number, "sources"],
  PermissionSource[]
>;

export type FormattedPermissionGroupAttributes = {
  [K in keyof GetPermissionGroupDataPermissionsDto["attributes"]]: {
    value: GetPermissionGroupDataPermissionsDto["attributes"][K];
    sources: PermissionSource[];
  };
};

export type FormattedPermissionGroupDataPermissions = Omit<
  GetPermissionGroupDataPermissionsDto,
  "domains" | "permission_tables" | "attributes"
> & {
  domains: FormattedPermissionGroupDomain[];
  permission_tables: FormattedPermissionGroupPermissionTable[];
  attributes: FormattedPermissionGroupAttributes;
};
