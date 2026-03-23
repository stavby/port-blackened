import z from "zod";
import { NON_ADMIN_ROLE_NAME_ENUM, objectIdStringSchema } from "./consts.ts";
import { rowFilterQueryBuilderTypes, rowFilterTypes } from "./permission.dto.ts";
import { userIdSchema } from "@port/common-schemas";
import { domainSchema } from "./base/domains.ts";
import { classificationSchema } from "./base/classifications.ts";
import { permissionGroupSchema } from "./base/permission_groups.ts";
import { baseUserRowFilterSchema, baseUserSchema } from "./base/users.ts";
import { tableSchema } from "./base/tables.ts";

export type UniquePopulationOption = { id: number; name: string };

export const getUserRowFilterSchema = baseUserRowFilterSchema
  .pick({
    kod: true,
    values: true,
  })
  .extend({
    type: z.enum(rowFilterTypes),
    query_builder_type: z.enum(rowFilterQueryBuilderTypes),
    display_name: z.string(),
  });

const populatedPermissionModifierSchema = z.object({
  user_id: userIdSchema,
  roles: z.object({ _id: objectIdStringSchema(), name: NON_ADMIN_ROLE_NAME_ENUM }).array(),
});

const populatedUserDomain = baseUserSchema.shape.domains.element
  .pick({ id: true, create_date: true, last_change: true })
  .merge(domainSchema.pick({ display_name: true, name: true }))
  .extend({
    classifications: classificationSchema.pick({ _id: true, name: true }).array(),
    given_by: populatedPermissionModifierSchema.optional(),
    last_changed_by: populatedPermissionModifierSchema.optional(),
  });

const populatedUserPermissionTable = baseUserSchema.shape.permission_tables.element
  .pick({
    id: true,
  })
  .extend({
    name: z.string().nonempty(),
    display_name: z.string().nonempty(),
    permission_keys: z.object({ name: z.string().nonempty(), display_name: z.string().nonempty() }).array(),
    row_filters: getUserRowFilterSchema.array(),
  });

export const getUserSchema = baseUserSchema
  .pick({
    _id: true,
    user_id: true,
    attributes: true,
    first_name: true,
    last_name: true,
    is_read_all: true,
  })
  .extend({
    domains: populatedUserDomain.array(),
    permission_tables: populatedUserPermissionTable.array(),
    permission_groups: baseUserSchema.shape.permission_groups.element
      .omit({ id: true })
      .partial()
      .merge(
        permissionGroupSchema.pick({ _id: true, name: true, color: true, attributes: true }).extend({
          domains: populatedUserDomain.array(),
          permission_tables: populatedUserPermissionTable.array(),
        }),
      )
      .array(),
    is_sap_permitted: z.boolean(),
  });

export const getUsersResponseSchema = z.object({
  metadata: z.tuple([z.object({ totalCount: z.number().nonnegative() })]),
  users: getUserSchema.array(),
});

export type GetUsersResponseDto = z.infer<typeof getUsersResponseSchema>;

const userCatalogSchema = z.object({
  schema_name: z.string(),
  write: z.boolean(),
});

export const userCatalog = z.object({
  read_all: z.boolean().optional(),
  write: z.boolean().optional(),
  schemas: userCatalogSchema.array().optional(),
});

export const getDictUserDto = z
  .object({
    user_id: userIdSchema,
    catalogs: z.record(z.string(), userCatalog),
    domains: z.record(objectIdStringSchema(), baseUserSchema.shape.domains.element.pick({ classifications: true })),
    dimensions: z.record(z.string(), z.string()),
  })
  .merge(baseUserSchema.pick({ attributes: true }));

export const getUsersDictionaryDtoSchema = z.record(baseUserSchema.shape.user_id, getDictUserDto);

const getUserPreviewDataSchema = z.object({
  domains: baseUserSchema.shape.domains.element
    .pick({
      id: true,
      classifications: true,
    })
    .array(),
  is_read_all: z.boolean(),
});

const getNewUserPreviewSchema = z.object({
  type: z.literal("new"),
  data: getUserPreviewDataSchema,
});

const getCurrentUserPreviewSchema = z.object({
  type: z.literal("current"),
});

const getComparedUserPreviewSchema = z.object({
  type: z.literal("compare"),
  data: getUserPreviewDataSchema,
});

export const getUserPreviewSchema = z.object({
  payload: z.discriminatedUnion("type", [getNewUserPreviewSchema, getCurrentUserPreviewSchema, getComparedUserPreviewSchema]),
});

export type GetUserPreviewSchema = z.infer<typeof getUserPreviewSchema>;

export const tablePreviewDtoSchema = z
  .object({
    attributes: z.object({
      domain_id: objectIdStringSchema(),
      domain: z.string(),
      display_name: z.string(),
      row_filter: z.boolean().optional(),
    }),
    permission_source: z.object({
      prevSource: z.string().optional(),
      source: z.string().optional(),
    }),
    opaCount: z.number().int().nonnegative(),
    shieldCount: z.number().int().nonnegative(),
    haveNewColumns: z.boolean().optional(),
    haveDeletedColumns: z.boolean().optional(),
  })
  .merge(
    tableSchema.pick({
      table_name: true,
      table_display_name: true,
      columns_dict: true,
      catalog_name: true,
      schema_name: true,
      application: true,
    }),
  );

export type TablePreviewDto = z.infer<typeof tablePreviewDtoSchema>;

export const getDictUserPreviewSchemaDto = getDictUserDto.pick({ user_id: true, domains: true, catalogs: true });

export type GetDictUserPreviewSchemaDto = z.infer<typeof getDictUserPreviewSchemaDto>;

export const createUserSchema = baseUserSchema.pick({ user_id: true, attributes: true, is_read_all: true }).extend({
  user_id: userIdSchema,
  attributes: baseUserSchema.shape.attributes.omit({ blocked: true }),
  domains: baseUserSchema.shape.domains.element
    .pick({
      id: true,
      classifications: true,
    })
    .array(),
  permission_tables: baseUserSchema.shape.permission_tables.element
    .pick({
      id: true,
    })
    .extend({
      row_filters: baseUserRowFilterSchema
        .pick({ kod: true })
        .extend({ values: baseUserRowFilterSchema.shape.values.element.shape.value.array() })
        .array(),
    })
    .array(),
  permission_groups: baseUserSchema.shape.permission_groups.element.shape.id.array(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const editUserSchema = createUserSchema.pick({
  attributes: true,
  domains: true,
  permission_tables: true,
  permission_groups: true,
  is_read_all: true,
});

export type EditUserDto = z.infer<typeof createUserSchema>;

export const editUserResponseSchema = z.object({
  user: getUserSchema,
  lockedDomains: createUserSchema.shape.domains.element.extend({ operation: z.enum(["update", "delete"]) }).array(),
  lockedPermissionTables: createUserSchema.shape.permission_tables,
});

export type EditUserResDto = z.infer<typeof editUserResponseSchema>;

export const getPermissionTablesOptionsRequestSchema = createUserSchema.pick({ domains: true });

export type GetPermissionTablesOptionsRequestDto = z.infer<typeof getPermissionTablesOptionsRequestSchema>;

export const getPermissionTablesOptionsSchema = getUserSchema.shape.permission_tables;

export type GetPermissionTablesOptionsDto = z.infer<typeof getPermissionTablesOptionsSchema>;
