import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const userClassificationsActionDtoSchema = z.object({
  action_id: objectIdSchema,
  user_object_id: objectIdSchema,
  domain_id: objectIdSchema,
  type: z.enum(["new", "deleted"]),
  classification: objectIdSchema,
});

export class UserClassificationActionsDto extends createZodDto(userClassificationsActionDtoSchema) {}
