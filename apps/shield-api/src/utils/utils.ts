import { Injectable, PipeTransform } from "@nestjs/common";
import { UserID, userIdSchema } from "@port/common-schemas";
import diff from "microdiff";
import z from "zod";
import { convertObjectIdToString } from "./mongo.utils";

export const customDiff = (obj: any, newObj: any, hasObjectId: boolean) => {
  return hasObjectId ? diff(convertObjectIdToString(obj), convertObjectIdToString(newObj)) : diff(obj, newObj);
};

export const shieldStandardTableSchema = z.object({
  table_name: z.string().toLowerCase(),
  schema_name: z.string().toLowerCase(),
});

export type ShieldStandardTable = z.infer<typeof shieldStandardTableSchema>;

// copy from remix yet adjusted to shield tables
export const parseRawTable = (rawTable: string): ShieldStandardTable | null => {
  const [table_name, schema_name] = rawTable.split(".").reverse();

  if (table_name && schema_name) {
    return { table_name, schema_name };
  }

  return null;
};

export const formatRawStandardTable = (standardTable: ShieldStandardTable): string => {
  return `${standardTable.schema_name}.${standardTable.table_name}`;
};

@Injectable()
export class ParseUserIdPipe implements PipeTransform<string, UserID> {
  transform(value: string) {
    return userIdSchema.parse(value);
  }
}
