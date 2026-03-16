import { z } from "zod";
import { standardTable } from "./models.ts";

export type FormattedAxiosError = {
  service: string;
  time: string;
  method?: string;
  url: string;
  params: unknown;
  status?: number;
  code?: string;
  errorData: unknown;
  isFormattedAxiosError: true;
};

export type StandardTable = z.infer<typeof standardTable>;

export type CommonProperties<T, U> = {
  [K in keyof T & keyof U]: T[K] & U[K];
};

export type SafeExtract<T, U extends Partial<T>> = T extends U ? T : never;