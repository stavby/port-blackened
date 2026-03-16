import z from "zod";

export const USERS_PER_PAGE = 10;
export const OBJECT_ID_DESC = "ObjectIdMarker";
export const objectIdStringSchema = () => z.string().nonempty().brand<"ObjectId">().describe(OBJECT_ID_DESC);
export type ObjectIdBrand = z.infer<ReturnType<typeof objectIdStringSchema>>;

export const SHIELD_ROLE_NAMES = ["amlach", "rav_amlach", "api_user", "support_center"] as const;
export const SHIELD_ROLE_NAME_ENUM = z.enum(SHIELD_ROLE_NAMES);
export const SHIELD_ROLE_NAME = SHIELD_ROLE_NAME_ENUM.enum;
export type ShieldRoleName = z.infer<typeof SHIELD_ROLE_NAME_ENUM>;

export const NON_ADMIN_ROLE_NAMES = [...SHIELD_ROLE_NAMES, "kapat", "implementor", "analyst", "documentator"] as const;
export const NON_ADMIN_ROLE_NAME_ENUM = z.enum(NON_ADMIN_ROLE_NAMES);
export const NON_ADMIN_ROLE_NAME = NON_ADMIN_ROLE_NAME_ENUM.enum;
export type NonAdminRoleName = z.infer<typeof NON_ADMIN_ROLE_NAME_ENUM>;

export const ROLE_NAMES = [...NON_ADMIN_ROLE_NAMES, "admin"] as const;
export const ROLE_NAMES_ENUM = z.enum(ROLE_NAMES);
export const ROLE_NAME = ROLE_NAMES_ENUM.enum;
export type RoleName = z.infer<typeof ROLE_NAMES_ENUM>;
