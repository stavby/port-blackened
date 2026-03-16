import { userIdSchema } from "@port/common-schemas";
import { createZodDto } from "nestjs-zod";
import z from "zod";

const giveWritePermissionsToUserSchema = z.object({
  user_id: userIdSchema,
  schema_name: z.string(),
});

export class ManageWritePermissionsToUserDTO extends createZodDto(giveWritePermissionsToUserSchema) {}