import { TaskWithTable } from "./tasks.interface";

export class ActiveTaskDto {
  type: string;
  tableId: string;
  create_date: Date;
  modify_date: Date;
  approval_id?: string;
  approval_date?: Date;
  tableData: TaskWithTable["tableData"];
}
