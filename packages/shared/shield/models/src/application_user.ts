import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Domain } from "./domain";
import { Role } from "./role";
import { Classification } from "./classification";

@Schema({ _id: false })
export class ApplicationUserDomain implements Pick<Domain, "classifications"> {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Domain.name,
    required: true,
  })
  id: mongoose.Types.ObjectId;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Role.name,
        required: true,
      },
    ],
    required: true,
  })
  roles: mongoose.Types.ObjectId[];

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Classification.name,
        required: true,
      },
    ],
    required: true,
  })
  classifications: mongoose.Types.ObjectId[];
}

@Schema({ collection: "application_users" })
export class ApplicationUser {
  @Prop({ unique: true, required: true })
  user_id: string;

  @Prop({ required: false })
  first_name?: string;

  @Prop({ required: false })
  last_name?: string;

  @Prop({ type: [ApplicationUserDomain], required: true })
  domains: ApplicationUserDomain[];

  @Prop({ required: true })
  is_admin: boolean;

  @Prop({ required: true })
  can_create_connections: boolean;

  @Prop({ required: true })
  can_manage_unique_population_indications: boolean;

  @Prop({ required: false })
  given_by?: string;

  @Prop({ required: false, type: Date })
  create_date?: Date;

  @Prop({ required: false })
  last_changed_by?: string;

  @Prop({ required: false, type: Date })
  last_change?: Date;
}

export const ApplicationUserSchema = SchemaFactory.createForClass(ApplicationUser);
