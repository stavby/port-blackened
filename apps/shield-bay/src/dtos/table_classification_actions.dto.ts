import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const tableClassificationActionDtoSchema = z.object({
  action_id: objectIdSchema,
  table_id: objectIdSchema,
  column_name: z.string().nonempty(),
  old_value: objectIdSchema.nullish(),
  new_value: objectIdSchema.nullish(),
});

export class TableClassificationActionDto extends createZodDto(tableClassificationActionDtoSchema) {}
