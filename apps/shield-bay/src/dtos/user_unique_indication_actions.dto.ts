import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const userUniqueIndicationActionDtoSchema = z.object({
  action_id: objectIdSchema,
  user_object_id: objectIdSchema,
  value: z.number(),
  type: z.enum(["new", "deleted"]),
});

export class UserUniqueIndicationActionDto extends createZodDto(userUniqueIndicationActionDtoSchema) {}
