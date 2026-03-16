import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const indicationTypes = ["deceased_population", "mask"] as const;
export type IndictionType = (typeof indicationTypes)[number];

const actionTypes = ["ON", "OFF"] as const;

export const userIndicationActionDtoSchema = z.object({
  action_id: objectIdSchema,
  indication_type: z.enum(indicationTypes),
  action_type: z.enum(actionTypes),
  user_object_id: objectIdSchema,
});

export class UserIndicationActionDto extends createZodDto(userIndicationActionDtoSchema) {}
