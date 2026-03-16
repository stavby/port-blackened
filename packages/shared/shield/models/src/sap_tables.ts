import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: "sap_tables" })
export class SapTables {
  @Prop({ required: true })
  schema_name: string;

  @Prop({ required: true })
  table_name: string;
}

export const SapTablesSchema = SchemaFactory.createForClass(SapTables);
