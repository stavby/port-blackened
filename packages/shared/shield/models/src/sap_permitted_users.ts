import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: "sap_permitted_users" })
export class SapPermittedUsers {
  @Prop({ unique: true, required: true })
  user_id: string;
}

export const SapPermittedUsersSchema = SchemaFactory.createForClass(SapPermittedUsers);
