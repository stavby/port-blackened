import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";
import { applicationUserIndicationDiffKind } from "@port/shield-models";

const actionTypes = ["ON", "OFF"] as const;

export const appUserBooleanAttributeActionSchema = z.object({
  action_id: objectIdSchema,
  boolean_attribute_type: z.enum(applicationUserIndicationDiffKind),
  action_type: z.enum(actionTypes),
  user_object_id: objectIdSchema,
});

export class AppUserBooleanAttributeActionDto extends createZodDto(appUserBooleanAttributeActionSchema) {}
