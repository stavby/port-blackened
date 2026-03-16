import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

const rowFilterTypes = ["integer", "string", "boolean"] as const;
type RowFilterType = (typeof rowFilterTypes)[number];

const rowFilterQueryBuilderTypes = ["select", "tree", "boolean"] as const;
type RowFilterQueryBuilderType = (typeof rowFilterQueryBuilderTypes)[number];

@Schema({ _id: false })
export class PermissionKey {
  @Prop()
  name: string;

  @Prop()
  display_name: string;

  @Prop()
  trino_type: string;
}

@Schema({ _id: false })
export class RowFilter {
  @Prop({ required: true })
  kod: string;

  @Prop({ required: true })
  display_name: string;

  @Prop({ required: true })
  dimensions_table: string;

  @Prop({ type: String, enum: rowFilterTypes, required: true })
  type: RowFilterType;

  @Prop({ type: String, enum: rowFilterQueryBuilderTypes, required: true })
  query_builder_type: RowFilterQueryBuilderType;
}

export type PermissionTableDocument = HydratedDocument<PermissionTable>;

@Schema({ collection: "permission_tables" })
export class PermissionTable {
  @Prop({ unique: true, required: true })
  name: string;

  @Prop({ required: true })
  display_name: string;

  @Prop({ type: [RowFilter], required: true })
  row_filters: RowFilter[];

  @Prop({ type: [PermissionKey] })
  permission_keys: PermissionKey[];
}

export const PermissionTableSchema = SchemaFactory.createForClass(PermissionTable);
