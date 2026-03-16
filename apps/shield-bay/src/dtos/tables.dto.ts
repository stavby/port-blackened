import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const tableDtoSchema = z.object({
  _id: objectIdSchema,
  catalog_name: z.string(),
  schema_name: z.string(),
  table_name: z.string(),
  table_display_name: z.string(),
  table_desc: z.string(),
  domain_id: objectIdSchema.optional(),
  permission_keys: z.preprocess((keys) => JSON.stringify(keys), z.string()),
  __v: z.number(),
  source_type: z.string(),
  owner: z.string(),
  permission_table: objectIdSchema.optional()
});

export class TableDto extends createZodDto(tableDtoSchema) {}
