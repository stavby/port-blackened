import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const auditingLegacyDtoSchema = z.object({
  _id: objectIdSchema,
  user_id: z.string().nonempty(),
  operation: z.string(),
  resource: z.string(),
  status: z.string(),
  message: z.string().optional(),
  difference: z.preprocess((keys) => JSON.stringify(keys), z.string()).optional(),
  resource_info: z.preprocess((keys) => JSON.stringify(keys), z.string()),
  time: z.string().nonempty().datetime(),
});

export class AuditingLegacyDto extends createZodDto(auditingLegacyDtoSchema) {}
