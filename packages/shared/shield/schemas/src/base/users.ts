import { userIdSchema } from "@port/common-schemas";
import z from "zod";
import { objectIdStringSchema } from "../consts.ts";

const userTypes = ["לקוח קצה", 'קפ"ט', "חוקר", "מערכת"] as const;

export const baseUserRowFilterSchema = z.object({
  kod: z.string().nonempty(),
  values: z.object({ value: z.union([z.string(), z.number()]), display_name: z.string() }).array(),
});

const auditMetadataSchema = z.object({
  create_date: z.coerce.date().nullish(),
  given_by: userIdSchema.nullish(),
  last_change: z.coerce.date().nullish(),
  last_changed_by: userIdSchema.nullish(),
});

export const baseUserSchema = z.object({
  _id: objectIdStringSchema(),
  user_id: userIdSchema,
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  attributes: z.object({
    type: z.enum(userTypes),
    mask: z.boolean(),
    deceased_population: z.boolean().default(false),
    unique_population: z.preprocess(
      (arg) => (Array.isArray(arg) ? arg : []),
      z
        .number()
        .array()
        .refine((arg) => arg.length === new Set(arg).size, "Unique population array must have unique values"),
    ),
    blocked: z.boolean().optional(),
  }),
  domains: z
    .object({
      id: objectIdStringSchema(),
      classifications: objectIdStringSchema().array(),
    })
    .merge(auditMetadataSchema)
    .array(),
  permission_tables: z
    .object({
      id: objectIdStringSchema(),
      row_filters: baseUserRowFilterSchema.array(),
    })
    .merge(auditMetadataSchema)
    .array(),
  permission_groups: z
    .object({
      id: objectIdStringSchema(),
      given_by: userIdSchema,
      registration_date: z.date(),
    })
    .array(),
  is_read_all: z.boolean().optional(),
});

export type BaseUser = z.infer<typeof baseUserSchema>;

export const DEFAULT_USER_ATTRIBUTES = {
  type: "לקוח קצה",
  mask: true,
  unique_population: [],
  deceased_population: false,
} as const satisfies BaseUser["attributes"];
