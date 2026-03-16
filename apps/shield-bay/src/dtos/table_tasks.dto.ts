import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { objectIdSchema } from "../common/utils";

export const tableTaskDtoSchema = z.object({
  _id: objectIdSchema,
  done: z.boolean(),
  table_id: objectIdSchema,
  create_date: z.date(),
  modify_date: z.date(),
  approval_date: z.date().optional(),
  approval_id: z.string().optional()
});

export class TableTaskDto extends createZodDto(tableTaskDtoSchema) {}
