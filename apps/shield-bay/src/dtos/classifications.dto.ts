import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const classificationDtoSchema = z.object({
  _id: objectIdSchema,
  name: z.string().nonempty(),
  description: z.string().nonempty(),
});

export class ClassificationDto extends createZodDto(classificationDtoSchema) {}
