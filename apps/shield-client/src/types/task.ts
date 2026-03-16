import { TableAttributes } from "./tables";

export const TASK_TABLE_TYPE = "TableClassification";
export const TASK_PERMISSION_REQ_TYPE = "PermissionRequest";

export type TaskType = typeof TASK_PERMISSION_REQ_TYPE | typeof TASK_TABLE_TYPE;

export type GeneralTaskCommon = {
  _id: string;
  tableId?: string;
  permissionId?: string;
  create_date: Date;
  modify_date: Date;
};

export type TableClassificationTaskData = {
  _id: string;
  table_name: string;
  table_display_name: string;
  attributes: TableAttributes;
  owner: string;
};

export type TableClassificationTask = {
  type: typeof TASK_TABLE_TYPE;
  tableData: TableClassificationTaskData & { is_sap: boolean; source_type: string; connection_display_name?: string };
} & GeneralTaskCommon;

export type PermissionRequestTaskData = object;

export type PermissionRequestTask = {
  type: typeof TASK_PERMISSION_REQ_TYPE;
  data: PermissionRequestTaskData;
} & GeneralTaskCommon;

export type GeneralTask = TableClassificationTask | PermissionRequestTask;
