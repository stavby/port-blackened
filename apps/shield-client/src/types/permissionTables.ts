export interface PermissionKey {
  name: string;
  display_name: string;
  trino_type: string;
}

export interface PermissionTable {
  _id: string;
  name: string;
  display_name: string;
  row_filters: RowFilter[];
  permission_keys: PermissionKey[];
}

export type RowFilterQueryBuilderType = "select" | "tree" | "boolean";

export interface RowFilter {
  kod: string;
  display_name: string;
  type: string;
  query_builder_type: RowFilterQueryBuilderType;
}

export type RowFilterValue = {
  value: string | number;
  display_name: string;
};

export type RowFilterFlatTreeValue = RowFilterValue & {
  parent?: string;
};

export type RowFilterTreeValue = RowFilterFlatTreeValue & {
  children: RowFilterTreeValue[];
};

export type QueryBuilderFieldConfig = {
  value: string;
  display_name: string;
  query_builder_type: RowFilterQueryBuilderType;
};
