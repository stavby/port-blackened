import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const userRowFilterValueActionDtoSchema = z.object({
  action_id: objectIdSchema,
  user_object_id: objectIdSchema,
  permission_table_id: objectIdSchema,
  row_filter_kod: z.string().nonempty(),
  type: z.enum(["new", "deleted"]),
  row_filter_value: z.coerce.string().nonempty(),
});

export class UserRowFilterValueActionDto extends createZodDto(userRowFilterValueActionDtoSchema) {}
