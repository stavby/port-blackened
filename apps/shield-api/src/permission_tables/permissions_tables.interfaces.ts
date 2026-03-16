import { UserRowFilterValue } from "src/user/user.classes";
import { PermissionTableWithPermissionKeys, RowFilter } from "./permission_tables.classes";
import { RowFilterFlatTreeValueDto } from "./permission_table.dto";

export type RowFilterValuesByDimensionsTable = {
  [dimensions_table: RowFilter["dimensions_table"]]: (UserRowFilterValue | RowFilterFlatTreeValueDto)[];
};

export type PermissionTableDictionary = {
  [permission_table_name: string]: PermissionTableWithPermissionKeys;
};
