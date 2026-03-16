import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const appUserRoleActionDtoSchema = z.object({
  action_id: objectIdSchema,
  user_object_id: objectIdSchema,
  domain_id: objectIdSchema,
  type: z.enum(["new", "deleted"]),
  role_id: objectIdSchema,
});

export class AppUserRoleActionDto extends createZodDto(appUserRoleActionDtoSchema) {}
