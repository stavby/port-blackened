import z from "zod";
import { objectIdStringSchema } from "../consts.ts";

export const domainSchema = z.object({
  _id: objectIdStringSchema(),
  name: z.string(),
  display_name: z.string(),
  classifications: objectIdStringSchema().array(),
});

export type Domain = z.infer<typeof domainSchema>;
