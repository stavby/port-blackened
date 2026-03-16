import { IsDefined, IsIn } from "class-validator";
import { IsNotEmptyString, IsObjectType } from "src/utils/validation/validation.decorators";

const rowFilterTypes = ["integer", "string", "boolean"] as const;
type RowFilterType = (typeof rowFilterTypes)[number];

const rowFilterQueryBuilderTypes = ["select", "tree", "boolean"] as const;
export type RowFilterQueryBuilderType = (typeof rowFilterQueryBuilderTypes)[number];

export class RowFilter {
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

export class PermissionTable {
  @IsNotEmptyString()
  name: string;

  @IsObjectType(RowFilter, { isArray: true })
  row_filters: RowFilter[];
}

export class PermissionTableWithPermissionKeys {
  @IsDefined()
  permission_keys: Record<string, string>;
}
