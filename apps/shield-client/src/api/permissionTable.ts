import {
  PERMISSION_TABLE_BY_ID_ENDPOINT,
  PERMISSION_TABLE_ENDPOINT,
  ROW_FILTERS_OPTIONS_ENDPOINT,
} from "@constants";
import { PermissionTable, RowFilter, RowFilterValue } from "@types";
import axios from "axios";

export const getPermissionTableById = async (id: string) => {
  const { data } = await axios.get<PermissionTable>(PERMISSION_TABLE_BY_ID_ENDPOINT(id));

  return data;
};

export const getRowFiltersOptions = async <R extends RowFilterValue = RowFilterValue>(
  permissionTableId: PermissionTable["_id"],
  rowFilterKod: RowFilter["kod"],
  treeOptions?: { unflatten: boolean },
) => {
  const { data } = await axios.get<R[]>(ROW_FILTERS_OPTIONS_ENDPOINT(permissionTableId, rowFilterKod), {
    params: treeOptions,
  });

  return data;
};

export const getPermissionTables = async (): Promise<PermissionTable[]> => {
  const { data } = await axios.get<PermissionTable[]>(PERMISSION_TABLE_ENDPOINT);

  return data;
};
