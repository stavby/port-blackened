import z from "zod";
import { objectIdStringSchema } from "./consts.ts";

export type FilterUserOptions = "domains" | "userTypes" | "permissionGroups" | "authorizationSource" | "specialProperties";

export const userTypes = ["לקוח קצה", 'קפ"ט', "חוקר", "מערכת"] as const;
export const specialProperties = { mask: "נתונים ללא התממה", deceased_population: "נפטרים", unique_population: "אוכלוסיות מיוחדות" };
export enum AuthorizationSource {
  ALL = "הכל",
  SAP = "Sap",
  SHIELD = "Shield",
}

export const FilterUserSchema = z.object({
  domains: z
    .object({
      _id: objectIdStringSchema(),
      selectedClassifications: z
        .object({
          _id: objectIdStringSchema(),
        })
        .array()
        .optional()
        .default([]),
    })
    .array()
    .optional(),
  userTypes: z.string().array().optional(),
  permissionGroups: z
    .object({
      _id: objectIdStringSchema(),
    })
    .array()
    .optional(),
  authorizationSource: z.string().optional(),
  specialProperties: z.string().array().optional(),
} satisfies Record<FilterUserOptions, z.ZodSchema>);

export type FilterUserType = z.infer<typeof FilterUserSchema>;
