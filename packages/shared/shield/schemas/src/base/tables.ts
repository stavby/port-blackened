import { SuperRefinement, z } from "zod";
import {
  anyOwnerSchema,
  columnSchema,
  Dataset,
  datasetOwnershipSuperRefinement,
  datasetPermissionKeySuperRefinement,
  datasetScheduleSuperRefinement,
  datasetSchema,
  schemaUniqueRefinement,
} from "@port/common-schemas";
import { objectIdStringSchema } from "../consts.ts";

export const tablePermissionKeysSchema = z.record(z.string(), z.string());

export type TablePermissionKeys = z.infer<typeof tablePermissionKeysSchema>;

const masks = ["none", "null", "hash"] as const;

export const maskEnumSchema = z.enum(masks);

export type Mask = z.infer<typeof maskEnumSchema>;

export const editableColumnAttributesSchema = z.object({
  classification: objectIdStringSchema().optional(),
  mask: maskEnumSchema.optional(),
});

export type EditableColumnAttributes = z.infer<typeof editableColumnAttributesSchema>;

export const draftApproversSchema = z.object({
  inspection: z.string(),
  professional: z.string(),
});

export type DraftApprovers = z.infer<typeof draftApproversSchema>;

export const columnNameSchema = z
  .string()
  .transform((name) => name.toLowerCase())
  .refine((name) => !name.includes("."), { message: "Column names cannot contain dots" });

export const draftDataSchema = z.object({
  approvers: draftApproversSchema,
  columns_dict: z.record(columnNameSchema, editableColumnAttributesSchema),
});

export type DraftData = z.infer<typeof draftDataSchema>;

export const baseColumnAttributesSchema = z.object({
  data_type: z.string(),
  column_display_name: z.string(),
  column_desc: z.string().optional(),
});

export type BaseColumnAttributes = z.infer<typeof baseColumnAttributesSchema>;

export const columnAttributesSchema = baseColumnAttributesSchema.extend(editableColumnAttributesSchema.shape);

export type ColumnAttributes = z.infer<typeof columnAttributesSchema>;

export const shieldColumnSchema = z.object({
  column_name: columnNameSchema,
  attributes: columnAttributesSchema,
});

const columnPreviewDto = shieldColumnSchema.omit({ attributes: true }).extend({
  attributes: columnAttributesSchema.extend({ is_new: z.boolean().optional(), is_deleted: z.boolean().optional() }),
});

export const columns_dict_preview_dto = z.record(columnNameSchema, columnPreviewDto);

export type ColumnsDictPreviewDto = z.infer<typeof columns_dict_preview_dto>;

export type Column = z.infer<typeof shieldColumnSchema>;

export const columns_dict = z.record(columnNameSchema, shieldColumnSchema);

export type ColumnsDict = z.infer<typeof columns_dict>;

export const connectionSchema = z.object({
  display_name: z.string(),
  is_test: z.boolean().optional(),
});

export type Connection = z.infer<typeof connectionSchema>;

export const tableSchema = z.object({
  catalog_name: z.string(),
  schema_name: z.string(),
  table_name: z.string(),
  table_display_name: z.string(),
  table_desc: z.string(),
  domain_id: z.string(),
  permission_keys: tablePermissionKeysSchema,
  permission_table: z.string().optional(),
  application: datasetSchema.shape.application,
  columns_dict: z.record(columnNameSchema, shieldColumnSchema),
  owner: z.string(),
  draft_data: draftDataSchema.optional(),
  source_type: z.string().optional(),
  connection: connectionSchema.optional(),
  is_deprecated: z.boolean().optional().default(false),
});

export type Table = z.infer<typeof tableSchema>;

const commonUpsertTableSchema = datasetSchema
  .pick({
    table_display_name: true,
    table_desc: true,
    domain_id: true,
    is_internal: true,
    permission_table_id: true,
    permission_key: true,
    schedule: true,
  })
  .required({ is_internal: true })
  .extend({
    table_name: datasetSchema.shape.table_name.toLowerCase(),
    schema_name: datasetSchema.shape.schema_name.toLowerCase(),
    permission_key_column: datasetSchema.shape.permission_key_column.transform((value) => (value ? value.toLowerCase() : value)),
    schema: columnSchema
      .transform((column) => ({ ...column, column_name: column.column_name.toLowerCase() }))
      .array()
      .min(1, "Must contain at least one column")
      .refine(schemaUniqueRefinement.check, { message: schemaUniqueRefinement.message }),
  });
const queryBasedDatasetExtension = datasetSchema
  .pick({
    schedule_type: true,
    query: true,
    all_dependencies: true,
    updating_dependencies: true,
  })
  .required({
    schedule_type: true,
    query: true,
    all_dependencies: true,
  });

const upsertFlowSchema = commonUpsertTableSchema
  .extend({
    application: z.literal("connect" satisfies Dataset["application"]),
    connection: z
      .object({
        connection_id: z.number(),
        display_name: z.string(),
        is_test: z.boolean(),
      })
      .optional(),
  })
  .merge(datasetSchema.pick({ owner: true, process_type: true, source_type: true }))
  .required({ schedule: true, process_type: true, source_type: true });

const upsertMixSchema = commonUpsertTableSchema
  .extend({
    application: z.literal("remix" satisfies Dataset["application"]),
  })
  .merge(datasetSchema.pick({ owner: true, co_owners: true }))
  .required({ co_owners: true })
  .merge(queryBasedDatasetExtension);

const upsertExternalSchema = commonUpsertTableSchema
  .extend({
    application: z.literal("external" satisfies Dataset["application"]),
  })
  .merge(datasetSchema.pick({ process_type: true }))
  .required({ process_type: true })
  .merge(queryBasedDatasetExtension);

const refinedUpsertExternalTableSchema = upsertExternalSchema.superRefine((data, ctx) => {
  datasetPermissionKeySuperRefinement(data, ctx);
  datasetScheduleSuperRefinement(data, ctx);
});

export type UpsertExternalTable = z.infer<typeof refinedUpsertExternalTableSchema>

const refinedUpsertInternalTableSchema = z.discriminatedUnion("application", [
  // CONNECT
  upsertFlowSchema,
  // REMIX
  upsertMixSchema,
])
  .superRefine((data, ctx) => {
    datasetPermissionKeySuperRefinement(data, ctx);
    if (data.application === "remix") {
      datasetScheduleSuperRefinement(data, ctx);
    }
    if ("co_owners" in data) {
      datasetOwnershipSuperRefinement(data, ctx);
    }
  });


export type UpsertInternalTable = z.infer<typeof refinedUpsertInternalTableSchema>

const duplicateTableSuperRefinement: SuperRefinement<Array<Pick<Dataset, "table_name" | "schema_name">>> = (tables, ctx) => {
  const existingTables = new Set<string>();

  for (const table of tables) {
    const key = `${table.schema_name}.${table.table_name}`;
    if (existingTables.has(key)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate table found: ${key}`, path: [tables.indexOf(table)] });
    }
    existingTables.add(key);
  }
}

export const refinedUpsertExternalTablesSchema = refinedUpsertExternalTableSchema.array().superRefine(duplicateTableSuperRefinement)

export type UpsertExternalTables = z.infer<typeof refinedUpsertExternalTablesSchema>;

export const refinedUpsertInternalTablesSchema = refinedUpsertInternalTableSchema.array().superRefine(duplicateTableSuperRefinement)

export type UpsertInternalTables = z.infer<typeof refinedUpsertInternalTablesSchema>

export const spyglassUpsertTableSchema = z
  .discriminatedUnion("application", [
    // CONNECT
    upsertFlowSchema.omit({ owner: true }).extend({ owner: anyOwnerSchema }),
    // REMIX
    upsertMixSchema.omit({ owner: true, co_owners: true }).extend({ owner: anyOwnerSchema, co_owners: anyOwnerSchema.array() }),
    // EXTERNAL
    upsertExternalSchema,
  ])
  .superRefine((data, ctx) => {
    datasetPermissionKeySuperRefinement(data, ctx);
    if (data.application === "external" || data.application === "remix") {
      datasetScheduleSuperRefinement(data, ctx);
    }
    if ("co_owners" in data) {
      datasetOwnershipSuperRefinement(data, ctx);
    }
  });

export type SpyglassUpsertTable = z.infer<typeof spyglassUpsertTableSchema>;



export const upsertTableResponseSchema = z
  .discriminatedUnion("status", [
    commonUpsertTableSchema.pick({ table_name: true, schema_name: true }).extend({ status: z.literal("success") }),
    commonUpsertTableSchema.pick({ table_name: true, schema_name: true }).extend({
      status: z.literal("error"),
      error_message: z.string(),
    }),
  ])
  .array();

export type UpsertTableResponse = z.infer<typeof upsertTableResponseSchema>;
