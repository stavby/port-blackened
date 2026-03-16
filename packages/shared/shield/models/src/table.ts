import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Classification } from "./classification";
import { Domain } from "./domain";
import { PermissionTable } from "./permission_table";
import { Dataset } from "@port/common-schemas";

export const maskTypes = ["none", "null", "hash"] as const;
export type MaskType = (typeof maskTypes)[number];

export class EditableColumnAttributes {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Classification.name,
  })
  classification?: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: maskTypes, default: "none" })
  mask?: MaskType;
}

@Schema({ _id: false })
export class ColumnAttributes extends EditableColumnAttributes {
  @Prop({ required: true })
  data_type: string;

  @Prop({ default: "" })
  column_display_name: string;

  @Prop({ default: "" })
  column_desc: string;

  @Prop({ default: false })
  is_key?: boolean;
}

@Schema({ _id: false })
export class Column {
  @Prop({ required: true })
  column_name: string;

  @Prop({ type: ColumnAttributes, required: true })
  attributes: ColumnAttributes;
}

export const ColumnSchema = SchemaFactory.createForClass(Column);

export type TableDocument = HydratedDocument<Table>;

@Schema({ _id: false })
export class TableAttributes {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Domain.name,
    required: true,
  })
  domain_id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  domain: string;

  @Prop({ required: true })
  display_name: string;
}

@Schema({ _id: false })
export class Connection {
  @Prop({ required: true })
  display_name: string;

  @Prop({ required: false, default: false })
  is_test?: boolean;
}

@Schema({ _id: false })
export class VerificationStage {
  @Prop({ required: true })
  stage: string;

  @Prop({ required: true })
  is_checked: boolean;
}

@Schema({ _id: false })
export class CoOwner {
  @Prop()
  id: string;

  @Prop()
  name: string;
}

@Schema()
export class Table {
  @Prop({ required: true })
  catalog_name: string;

  @Prop({ required: true })
  schema_name: string;

  @Prop({ required: true })
  table_name: string;

  @Prop({ default: "" })
  table_display_name: string;

  @Prop({ default: "" })
  table_desc: string;

  @Prop({ type: TableAttributes, required: true })
  attributes: TableAttributes;

  @Prop({ type: Map, of: String, required: true })
  permission_keys: Map<string, string>;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: PermissionTable.name })
  permission_table?: mongoose.Types.ObjectId;

  @Prop({ type: Map, of: ColumnSchema, required: true })
  columns_dict: Map<string, Column>;

  @Prop({ required: true })
  owner: string;

  @Prop({ type: [CoOwner], required: false })
  co_owners?: CoOwner[];

  @Prop()
  source_type: string;

  @Prop({ type: Connection, required: false })
  connection?: Connection;

  @Prop({ type: mongoose.Schema.Types.String, required: false })
  application: Dataset["application"];

  @Prop({ required: false })
  query?: string;

  @Prop({ type: mongoose.Schema.Types.String, required: false })
  schedule_type?: Dataset["schedule_type"];

  @Prop({ type: mongoose.Schema.Types.String, required: false })
  process_type?: Dataset["process_type"];

  @Prop({ required: false })
  schedule?: string;

  @Prop({ type: [mongoose.Schema.Types.String], required: false })
  updating_dependencies?: string[];

  @Prop({ type: [VerificationStage], required: false, default: undefined })
  verification_stages?: VerificationStage[];

  @Prop()
  last_verification_time?: Date;

  @Prop({ required: false, default: false })
  is_deprecated?: boolean;
}

export const TableSchema = SchemaFactory.createForClass(Table);
