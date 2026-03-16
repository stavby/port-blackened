import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ClassificationDocument = HydratedDocument<Classification>;

@Schema()
export class Classification {
  @Prop({ unique: true, required: true })
  name: string;

  @Prop({ required: true })
  description: string;
}

export const ClassificationSchema = SchemaFactory.createForClass(Classification);
