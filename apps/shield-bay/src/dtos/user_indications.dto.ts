import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { indicationTypes } from "./user_indication_actions.dto";

export const userIndicationDtoSchema = z.object({
  indication_type: z.enum(indicationTypes),
  value: z.boolean(),
  user_id: z.string(),
});

export class UserIndicationDto extends createZodDto(userIndicationDtoSchema) {}
