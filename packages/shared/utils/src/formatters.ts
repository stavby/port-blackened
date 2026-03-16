import { type AxiosError } from "axios";
import { FormattedAxiosError, StandardTable } from "./types.ts";
import z from "zod";

export const formatAxiosError = (service: string, error: AxiosError): Error & FormattedAxiosError => {
  const formattedAxiosError: FormattedAxiosError = {
    service,
    time: new Date().toLocaleString(),
    method: error.config?.method,
    url: `${error.config?.baseURL ?? ""}${error.config?.url}`,
    params: error.config?.params,
    status: error.response?.status,
    code: error.code,
    errorData: error.response?.data,
    isFormattedAxiosError: true,
  } as const satisfies FormattedAxiosError;

  const newError = new Error("FormattedAxiosError");
  newError.stack = error.stack;
  Object.entries(formattedAxiosError).forEach(([key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newError as any)[key as keyof FormattedAxiosError] = value;
  });

  return newError as Error & FormattedAxiosError;
};

export const isFormattedAxiosError = (error: unknown): error is Error & FormattedAxiosError =>
  typeof error === "object" &&
  error !== null &&
  ("isFormattedAxiosError" satisfies keyof FormattedAxiosError) in error &&
  error.isFormattedAxiosError === true;

export const stringify = (o: unknown) => {
  switch (typeof o) {
    case "object":
      return JSON.stringify(o, Object.getOwnPropertyNames(o));
    default:
      return String(o);
  }
};

export const formatRawStandardTable = (standardTable: StandardTable): string => {
  return `${standardTable.tableSchema}.${standardTable.tableName}`;
};

export const parseRawTable = (rawTable: string): StandardTable | null => {
  const [tableName, tableSchema] = rawTable.split(".").reverse();

  if (tableName && tableSchema) {
    return { tableName, tableSchema };
  }

  return null;
};

/**
 * @returns "dd/mm/yyyy" format
 */
export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return "";

  const dateAsString = date instanceof Date ? date.toISOString() : date;

  // Timezone of date can be marked with "T" prefix
  // or just with space (" ") between the date and timezone
  const dateWithoutTimezone = dateAsString.includes("T") ? dateAsString.split("T")[0] : dateAsString.split(" ")[0];

  const formatedDate = dateWithoutTimezone?.split("-") ?? "";
  return formatedDate[2] + "/" + formatedDate[1] + "/" + formatedDate[0];
};

/**
 * Standard way of transforming usernames (s,m,o,c).
 * Mainly used for handling unexpected usernames like Navy
 * users that have email-like usernames.
 */
export const transformUsername = (username: string): string | undefined => {
  const parsedEmail = z.string().email().safeParse(username);

  if (!parsedEmail.success) {
    return username;
  } else {
    const [usernameBeforeDomain] = parsedEmail.data.split("@");

    return usernameBeforeDomain;
  }
};
