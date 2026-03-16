import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const appUserClassificationDtoSchema = z.object({
  classification: objectIdSchema,
  user_id: z.string(),
  domain_id: objectIdSchema,
});

export class AppUserClassificationDto extends createZodDto(appUserClassificationDtoSchema) {}
