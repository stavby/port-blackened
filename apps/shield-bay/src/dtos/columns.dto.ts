import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const columnDtoSchema = z.object({
  table_id: objectIdSchema,
  permission_key: z.string().nullable(),
  column_name: z.string(),
  data_type: z.string(),
  column_display_name: z.string().optional(),
  column_desc: z.string().nullable().optional(),
  classification: objectIdSchema.optional(),
  mask: z.string().optional(),
});

export class ColumnDto extends createZodDto(columnDtoSchema) {}
