import { createZodDto } from "nestjs-zod";
import z from "zod";

export const userUniqueIndicationsDtoSchema = z.object({ user_id: z.string(), indication: z.number() });

export class UserUniqueIndicationDto extends createZodDto(userUniqueIndicationsDtoSchema) {}
