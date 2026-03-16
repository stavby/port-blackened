import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const domainClassificationDtoSchema = z.object({
  domain_id: objectIdSchema,
  classification_id: objectIdSchema.nullable()
});

export class DomainClassificationDto extends createZodDto(
  domainClassificationDtoSchema
) {}
