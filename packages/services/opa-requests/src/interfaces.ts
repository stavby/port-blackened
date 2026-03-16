import { StandardTable } from "@port/utils";

export interface ColumnSchema {
  column_name: string;
  data_type: string;
  column_display_name: string;
  column_desc: string;
  is_key: boolean;
  classification: string;
}

export interface OpaTablePermission {
  catalog_name: string;
  table_schema: string;
  table_name: string;
  columns: ColumnSchema["column_name"][];
}

export interface OpaTableLivePermission {
  catalog_name: string;
  table_schema: string;
  table_name: string;
  columns: ColumnSchema["column_name"][];
  permission_source: string;
}

export interface TablePermission extends StandardTable {
  columns: ColumnSchema["column_name"][];
  permission_source?: string;
}
