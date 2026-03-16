import { z } from "zod";

export const standardTable = z.object({
  tableSchema: z.string().min(1),
  tableName: z.string().min(1),
});
