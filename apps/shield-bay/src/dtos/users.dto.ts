import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const userDtoSchema = z.object({
  _id: objectIdSchema,
  user_id: z.string().nonempty(),
  type: z.string(),
  sap_permissions: z.boolean(),
  first_name: z.string().optional(),
  last_name: z.string().optional()
});

export class UserDto extends createZodDto(userDtoSchema) {}
