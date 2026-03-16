import z, { SuperRefinement } from "zod";
import { NON_ADMIN_ROLE_NAME_ENUM, objectIdStringSchema, ROLE_NAMES_ENUM, SHIELD_ROLE_NAME_ENUM } from "./consts.ts";
import { userIdSchema } from "@port/common-schemas";

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

const baseApplicationUserDomain = z.object({
  id: objectIdStringSchema(),
  classifications: objectIdStringSchema().array(),
  roleNames: NON_ADMIN_ROLE_NAME_ENUM.array().min(1),
});

const baseApplicationUser = z.object({
  userId: userIdSchema,
  fullName: z.string().nullish(),
  domains: baseApplicationUserDomain.array(),
  isAdmin: z.boolean(),
  canCreateConnections: z.boolean(),
  canManageUniquePopulationIndications: z.boolean(),
  createDate: z.coerce.date().nullish(),
  givenBy: z.string().nullish(),
  lastChangedBy: z.string().nullish(),
  lastChange: z.coerce.date().nullish(),
});

type BaseApplicationUser = z.infer<typeof baseApplicationUser>;
export const applicationUserBooleanAttributes = [
  "isAdmin",
  "canCreateConnections",
  "canManageUniquePopulationIndications",
] as const satisfies (keyof BaseApplicationUser)[];

export type ApplicationUserBooleanAttribute = (typeof applicationUserBooleanAttributes)[number];

export const applicationUserDto = baseApplicationUser.pick({ userId: true, fullName: true, createDate: true, isAdmin: true }).extend({
  roles: z
    .object({
      name: ROLE_NAMES_ENUM,
      displayName: z.string().nonempty(),
      color: z.string(),
    })
    .array(),
});

export type ApplicationUserDto = z.infer<typeof applicationUserDto>;

export const APPLICATION_USERS_SORTABLE_FIELDS = [
  "userId",
  "fullName",
  "createDate",
] as const satisfies (keyof typeof applicationUserDto.shape)[];

export const getApplicationUserParams = z.object({
  page: z.coerce.number().int().positive(),
  size: z.coerce.number().refine((value) => PAGE_SIZE_OPTIONS.includes(value as (typeof PAGE_SIZE_OPTIONS)[number]), "Invalid page value"),
  search: z.string().optional(),
  sortField: z.enum(APPLICATION_USERS_SORTABLE_FIELDS).default("createDate"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  actorId: userIdSchema,
});

export type GetApplicationUserParams = z.infer<typeof getApplicationUserParams>;
export type GetApplicationUserParamsInput = z.input<typeof getApplicationUserParams>;

export const getApplicationUsersDto = z.object({
  applicationUsers: applicationUserDto.array(),
  totalCount: z.number().int().nonnegative(),
});

export type GetApplicationUsersDto = z.infer<typeof getApplicationUsersDto>;

export const getApplicationUserDto = baseApplicationUser.pick({
  userId: true,
  fullName: true,
  domains: true,
  isAdmin: true,
  canCreateConnections: true,
  canManageUniquePopulationIndications: true,
});

export type GetApplicationUserDto = z.infer<typeof getApplicationUserDto>;

export const getApplicationManagePermissionsUserDto = baseApplicationUser
  .pick({
    domains: true,
  })
  .extend({
    canManageAdmins: z.boolean(),
    canManageCreateConnections: z.boolean(),
    canManageUniquePopulationAssigners: z.boolean(),
    canDeleteApplicationUsers: z.boolean(),
  });

export type GetApplicationUserManagePermissionsDto = z.infer<typeof getApplicationManagePermissionsUserDto>;

export const getLoggedUserInfo = baseApplicationUser.pick({ userId: true, fullName: true, isAdmin: true }).extend({
  roleNames: SHIELD_ROLE_NAME_ENUM.array(),
});

export type GetLoggedUserInfo = z.infer<typeof getLoggedUserInfo>;

export const getLoggedUserPermissionsDisplay = baseApplicationUser.pick({ isAdmin: true }).extend({
  roles: z
    .object({
      displayName: z.string(),
      domainDisplayNames: z.string().array(),
    })
    .array(),
});

export type GetLoggedUserPermissionsDisplay = z.infer<typeof getLoggedUserPermissionsDisplay>;

type CheckIsUserSetArg = Pick<BaseApplicationUser, "canCreateConnections" | "canManageUniquePopulationIndications" | "isAdmin"> & {
  domains: unknown[];
};

export const isApplicationUserSet = (user: CheckIsUserSetArg) => {
  return user.domains.length > 0 || user.isAdmin || user.canCreateConnections || user.canManageUniquePopulationIndications;
};

export const isApplicationUserValidSuperRefinement: SuperRefinement<CheckIsUserSetArg> = (user, context) => {
  if (!isApplicationUserSet(user)) {
    context.addIssue({ message: "User must have atleast one openfga property set", code: "custom" });
  }
};

export const createApplicationUserDto = baseApplicationUser
  .pick({
    userId: true,
    isAdmin: true,
    canCreateConnections: true,
    canManageUniquePopulationIndications: true,
    domains: true,
  })
  .extend({
    actorId: userIdSchema,
  });

export const refinedCreateApplicationUserDto = createApplicationUserDto.superRefine(isApplicationUserValidSuperRefinement);
export type CreateApplicationUserDto = z.infer<typeof createApplicationUserDto>;

export const createApplicationUserReturnDto = applicationUserDto;

export type CreateApplicationUserReturnDto = z.infer<typeof createApplicationUserReturnDto>;

export const editApplicationUserDto = createApplicationUserDto;

export type EditApplicationUserDto = z.infer<typeof editApplicationUserDto>;

export const editApplicationUserReturnDto = applicationUserDto;

export type EditApplicationUserReturnDto = z.infer<typeof editApplicationUserReturnDto>;

export const deleteApplicationUserDto = z.object({
  actorId: userIdSchema,
  userId: userIdSchema,
});

export type DeleteApplicationUserDto = z.infer<typeof deleteApplicationUserDto>;
