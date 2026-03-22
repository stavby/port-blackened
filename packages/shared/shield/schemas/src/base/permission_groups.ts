import { userIdSchema } from "@port/common-schemas";
import { objectIdStringSchema } from "../consts.ts";
import z from "zod";
import { BaseUser, baseUserSchema } from "./users.ts";

export const CoOwnerSchema = z.object({
  userId: userIdSchema,
  userName: z.string(),
});

export type CoOwner = z.infer<typeof CoOwnerSchema>;

export const PERMISSION_GROUPS_ATTRIBUTES = ["mask", "deceased_population"] as const satisfies (keyof BaseUser["attributes"])[];
const permissionGroupsAttributesPick = {
  mask: true,
  deceased_population: true,
} satisfies Record<(typeof PERMISSION_GROUPS_ATTRIBUTES)[number], true>;

export const permissionGroupSchema = z
  .object({
    _id: objectIdStringSchema(),
    name: z.string(),
    description: z.string().optional(),
    ownerId: userIdSchema,
    ownerName: z.string(),
    coOwners: z.array(CoOwnerSchema),
    color: z.string(),
    attributes: baseUserSchema.shape.attributes.pick(permissionGroupsAttributesPick),
  })
  .merge(baseUserSchema.pick({ domains: true, permission_tables: true }));
export type PermissionGroup = z.infer<typeof permissionGroupSchema>;
