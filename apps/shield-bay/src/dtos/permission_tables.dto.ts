import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const permissionTableDtoSchema = z.object({
  _id: objectIdSchema,
  name: z.string().nonempty(),
  display_name: z.string().nonempty(),
});

export class PermissionTableDto extends createZodDto(permissionTableDtoSchema) {}
