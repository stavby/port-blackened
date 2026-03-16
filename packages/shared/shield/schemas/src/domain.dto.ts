import z from "zod";
import { classificationSchema, domainSchema } from "./base/index.ts";

export const getDomainsDto = domainSchema.pick({ name: true, display_name: true }).extend({ domain_id: domainSchema.shape._id }).array();

export type GetDomainsDto = z.infer<typeof getDomainsDto>;

export const domainWithClassificationsSchema = domainSchema
  .omit({ classifications: true })
  .extend({ classifications: classificationSchema.array() });

export type DomainWithClassificationsDto = z.infer<typeof domainWithClassificationsSchema>;
