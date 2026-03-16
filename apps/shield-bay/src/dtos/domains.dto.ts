import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const domainDtoSchema = z.object({
  _id: objectIdSchema,
  name: z.string().nonempty(),
  display_name: z.string().nonempty().nullable().default(null),
});

export class DomainDto extends createZodDto(domainDtoSchema) {}
