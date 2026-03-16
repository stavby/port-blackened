import z from "zod";
import { objectIdStringSchema } from "../consts.ts";

export const classificationSchema = z.object({ _id: objectIdStringSchema(), name: z.string(), description: z.string() });

export type Classification = z.infer<typeof classificationSchema>;
