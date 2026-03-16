import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";
import { maskTypes } from "@port/shield-models";

export const tableMaskActionDtoSchema = z.object({
  action_id: objectIdSchema,
  table_id: objectIdSchema,
  column_name: z.string().nonempty(),
  old_value: z.enum(maskTypes).nullish(),
  new_value: z.enum(maskTypes).nullish(),
});

export class TableMaskActionDto extends createZodDto(tableMaskActionDtoSchema) {}
