import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Classification } from "./classification";

export type DomainDocument = HydratedDocument<Domain>;

@Schema()
export class Domain {
  @Prop({ unique: true, required: true })
  name: string;

  @Prop({ required: true })
  display_name: string;

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

export const DomainSchema = SchemaFactory.createForClass(Domain);
