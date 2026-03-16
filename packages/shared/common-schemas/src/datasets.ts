import z, { SuperRefinement } from "zod";
import { TRINO_UNKNOWN_TYPE } from "./constants.ts";
import { ProcessType } from "./enums.ts";
import { AnyOwner, userIdSchema } from "./users.ts";
import { CronExpressionParser } from "cron-parser";

const dataTypeSchema = z
  .string()
  .min(1)
  .max(1000, "סוג עמודה לא יכול להכיל יותר מ-1000 תווים")
  .refine(
    (value) => value.toLowerCase() !== TRINO_UNKNOWN_TYPE.toLowerCase(),
    "סוג עמודה חייב להיות מוגדר. יש להוסיף המרת סוג ברמת השאילתה",
  );

/**
 * @important
 * This schema does not include any refinements.
 * If you want to add refinements, please add them manually with the provided ones
 * @see {schemaUniqueRefinement}
 */
export const columnSchema = z.object({
  column_name: z
    .string()
    .min(1)
    .max(300, "שם עמודה לא יכול להכיל יותר מ-300 תווים")
    .refine((name) => !name.includes("."), { message: "שמות עמודות לא יכולים להכיל נקודות" }),
  data_type: dataTypeSchema,
  column_display_name: z
    .string()
    .min(2, "שם ידידותי לשדה חייב להיות לפחות 2 תווים")
    .max(300, "שם ידידותי לשדה לא יכול להיות יותר מ-300 תווים")
    .refine((value) => !value.includes("-"), "שם ידידותי לשדה לא יכול להכיל מקפים"),
  column_desc: z.string().min(0).max(3500, "תיאור העמודה לא יכול להיות יותר מ-3500 תווים").nullish(),
  is_key: z.boolean(),
});

export type ColumnSchema = z.infer<typeof columnSchema>;

export const schemaUniqueRefinement = {
  check: (schema: Pick<z.infer<typeof columnSchema>, "column_name">[]): boolean => {
    const set = new Set<string>();
    return !schema.some((column) => {
      if (set.has(column.column_name.toLowerCase())) {
        return true;
      } else {
        set.add(column.column_name.toLowerCase());
      }
    });
  },
  message: "שמות השדות בטבלה צריכים להיות שונים אחד מהשני (ללא התחשבות בCasing של השמות)",
};

/**
 * @important
 * This schema does not include any refinements.
 * If you want to add refinements, please add them manually with the provided ones
 * @see {datasetPermissionKeySuperRefinement}
 * @see {datasetScheduleSuperRefinement}
 * @see {datasetOwnershipSuperRefinement}
 * @todo discriminated unions for different applications.
 */
export const datasetSchema = z.object({
  application: z.enum(["connect", "remix", "external"]),
  schema_name: z.string(),
  table_name: z.string(),
  table_display_name: z
    .string()
    .min(5, "השם הידידותי חייב להיות לפחות 5 תווים")
    .max(80, "השם הידידותי לא יכול להיות יותר מ-80 תווים")
    .refine((value) => !value.includes("-"), "שם ידידותי לא יכול להכיל מקפים"),
  table_desc: z.string().min(0).max(3500, "תיאור לא יכול להיות יותר מ-1000 תווים"),
  domain_id: z.string(),
  schema: columnSchema
    .array()
    .min(1, "הסכמה חייבת להכיל לפחות עמודה אחת")
    .refine(schemaUniqueRefinement.check, { message: schemaUniqueRefinement.message }),
  owner: z.object({ id: userIdSchema, name: z.string() }),
  co_owners: z
    .array(z.object({ id: userIdSchema, name: z.string() }))
    .refine(
      (co_owners) => {
        return new Set(co_owners.map((user) => user.id)).size === co_owners.length;
      },
      { message: "המשתמשים צריכים להיות שונים" },
    )
    .optional(),
  permission_table_id: z.string().nullish(),
  permission_key: z.string().nullish(),
  permission_key_column: z.string().nullish(),

  is_internal: z.boolean().optional(),

  schedule_type: z.enum(["and", "or", "cron"]).optional(),
  schedule: z
    .string()
    .refine(
      (exp) => {
        try {
          CronExpressionParser.parse(exp);
          return true;
        } catch (_error) {
          return false;
        }
      },
      { message: "Invalid cron expression" },
    )
    .optional()
    .describe("A cron expression"),
  process_type: z.nativeEnum(ProcessType).optional(),
  delta_key: z.string().nullish(),
  updating_dependencies: z.string().array().nullish(),

  source_type: z.string().optional(),
  query: z.string().optional(),
  all_dependencies: z.string().array().optional(),
});

export const datasetPermissionKeySuperRefinement: SuperRefinement<
  Pick<Dataset, "permission_table_id" | "permission_key" | "permission_key_column">
> = (data, ctx) => {
  const isProvidedArray = [
    !!data.permission_table_id && data.permission_table_id !== "123456789",
    !!data.permission_key,
    !!data.permission_key_column,
  ];
  if (!(isProvidedArray.every((val) => val === true) || isProvidedArray.every((val) => val === false))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either all three of permission_table_id, permission_key and permission_key_column must be provided or none of them",
    });
  }
};

export const datasetScheduleSuperRefinement: SuperRefinement<Pick<Dataset, "schedule_type" | "schedule" | "updating_dependencies">> = (
  data,
  ctx,
) => {
  if (data.schedule_type === "cron" && !data.schedule) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "schedule is required when schedule_type is cron",
      path: ["schedule"],
    });
  }
  if (
    (data.schedule_type === "and" || data.schedule_type === "or") &&
    (!data.updating_dependencies || data.updating_dependencies.length === 0)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "updating_dependencies are required when schedule_type is and or or",
      path: ["updating_dependencies"],
    });
  }
};

export const datasetOwnershipSuperRefinement: SuperRefinement<{ owner: AnyOwner; co_owners: AnyOwner[] }> = (data, ctx) => {
  if (data.co_owners?.some((co_owner) => co_owner.id === data.owner.id)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "אין להזין משתמש גם בבעלות וגם כשותף לבעלות",
      path: ["co_owners"],
    });
  }
};

export type Dataset = z.infer<typeof datasetSchema>;
