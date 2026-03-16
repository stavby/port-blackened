import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const rowFilterDtoSchema = z.object({
  kod: z.string().nonempty(),
  display_name: z.string().nonempty(),
  dimensions_table: z.string().nonempty(),
  permission_table_id: objectIdSchema,
});

export class RowFilterDto extends createZodDto(rowFilterDtoSchema) {}
