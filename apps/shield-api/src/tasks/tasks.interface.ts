import { WithId } from "mongodb";
import mongoose from "mongoose";
import { Table } from "src/tables/table.classes";

export interface Task {
  type: string;
  done: boolean;
  tableId: string;
  create_date: Date;
  modify_date: Date;
  approval_id?: string;
  approval_date?: Date;
}

export interface TaskWithTable extends Task {
  tableData: Pick<WithId<Table>, "_id" | "table_name" | "table_display_name" | "attributes" | "owner">;
}

export type TaskOperationKind = "create-by-table" | "update-by-table" | "delete-by-table";

export type BaseTaskAction<T extends TaskOperationKind> = { kind: T };

export type CreateTableTaskAction = BaseTaskAction<"create-by-table"> & {
  tableId: mongoose.Types.ObjectId;
};

export type UpdateTaskAction = BaseTaskAction<"update-by-table"> & {
  tableId: mongoose.Types.ObjectId;
};

export type DeleteTaskAction = BaseTaskAction<"delete-by-table"> & {
  tableId: mongoose.Types.ObjectId;
};

export type TaskAction = CreateTableTaskAction | UpdateTaskAction | DeleteTaskAction;
