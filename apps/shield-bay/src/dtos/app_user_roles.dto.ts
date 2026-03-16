import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const appUserRoleDtoSchema = z.object({
  role_id: objectIdSchema,
  user_id: z.string(),
  domain_id: objectIdSchema,
});

export class AppUserRoleDto extends createZodDto(appUserRoleDtoSchema) {}
