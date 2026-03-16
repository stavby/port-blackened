import { IsNotEmptyString, IsObjectType } from "./validation/validation.decorators.ts";
import { IsIn } from "class-validator";

export const rowFilterTypes = ["integer", "string", "boolean"] as const;
type RowFilterType = (typeof rowFilterTypes)[number];

export const rowFilterQueryBuilderTypes = ["select", "tree", "boolean"] as const;
export type RowFilterQueryBuilderType = (typeof rowFilterQueryBuilderTypes)[number];

class RowFilter {
  @IsNotEmptyString()
  kod: string;

  @IsNotEmptyString()
  dimensions_table: string;

  @IsNotEmptyString()
  display_name: string;

  @IsIn(rowFilterTypes)
  type: RowFilterType;

  @IsIn(rowFilterQueryBuilderTypes)
  query_builder_type: RowFilterQueryBuilderType;
}

class PermissionKeys {
  @IsNotEmptyString()
  name: string;

  @IsNotEmptyString()
  trino_type: string;
}

class PermissionTable {
  @IsNotEmptyString()
  _id: string;

  @IsNotEmptyString()
  name: string;

  @IsNotEmptyString()
  display_name: string;

  @IsObjectType(RowFilter, { isArray: true })
  row_filters: RowFilter[];

  @IsObjectType(PermissionKeys, { isArray: true })
  permission_keys: PermissionKeys[];
}

export { RowFilter, PermissionTable };
