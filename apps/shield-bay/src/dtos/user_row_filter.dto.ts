import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const userRowFilterDtoSchema = z.object({
  user_id: z.string(),
  permission_table_id: objectIdSchema,
  display_name: z.string(),
  value: z.coerce.string().nonempty(),
  kod: z.string(),
});

export class UserRowFilterDto extends createZodDto(userRowFilterDtoSchema) {}
