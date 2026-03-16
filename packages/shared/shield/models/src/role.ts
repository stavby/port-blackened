import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type RoleDocument = HydratedDocument<Role>;

@Schema()
export class Role {
  @Prop({ unique: true, required: true })
  name: string;

  @Prop({ required: true })
  display_name: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  display_order: number;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
