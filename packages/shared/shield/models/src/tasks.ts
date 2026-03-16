import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Table } from "./table";

export type TaskDocument = HydratedDocument<Task>;
const taskTypes = ["TableClassification"];
type TaskType = (typeof taskTypes)[number];

@Schema()
export class Task {
  @Prop({ type: String, enum: taskTypes, required: true })
  type: TaskType;

  @Prop({ required: true })
  done: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Table.name, required: true })
  tableId: mongoose.Types.ObjectId;

  @Prop({ type: Date, required: true })
  create_date: Date;

  @Prop({ type: Date, required: true })
  modify_date: Date;

  @Prop({ type: Date, required: false })
  aprroval_date?: Date;

  @Prop({ required: false })
  aprroval_id?: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
