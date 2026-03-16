import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const auditLogDtoSchema = z.object({
  _id: objectIdSchema,
  user_id: z.string().nonempty(),
  time: z.date(),
});

export class AuditLogDto extends createZodDto(auditLogDtoSchema) {}
