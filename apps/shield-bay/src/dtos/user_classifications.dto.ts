import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const userClassificationDtoSchema = z.object({
  classification_id: objectIdSchema,
  user_id: z.string(),
  domain_id: objectIdSchema,
});

export class UserClassificationDto extends createZodDto(userClassificationDtoSchema) {}
