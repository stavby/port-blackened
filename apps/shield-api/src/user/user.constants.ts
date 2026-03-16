import { UserAttributes } from "@port/shield-models";
import { DEFAULT_USER_ATTRIBUTES } from "@port/shield-schemas";
import { User } from "./user.classes";

export const DEFAULT_USER_ATTRIBUTES_SERVER = {
  ...DEFAULT_USER_ATTRIBUTES,
  impersonate: { value: false },
} as const satisfies UserAttributes;

export const DEFAULT_USER_CATALOGS = {
  datalake: {
    write: false,
    read_all: false,
  },
} as const satisfies User["catalogs"];

export const SAP_INTERNAL_COLUMN_NAME = "uuid";
export const SAP_SOURCE_TYPE = "sap";
