import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const appUserDtoSchema = z.object({
  _id: objectIdSchema,
  user_id: z.string().nonempty(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  given_by: z.string().optional(),
  last_changed_by: z.string().optional(),
  create_date: z
    .date()
    .optional()
    .transform((date) => (date ? date.toISOString() : date)),
  last_change: z
    .date()
    .optional()
    .transform((date) => (date ? date.toISOString() : date)),
  is_admin: z.boolean(),
  can_create_connections: z.boolean(),
  can_manage_unique_population_indications: z.boolean(),
});

export class AppUserDto extends createZodDto(appUserDtoSchema) {}
