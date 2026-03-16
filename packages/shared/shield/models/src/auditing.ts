import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Difference } from "microdiff";
import mongoose, { HydratedDocument } from "mongoose";

export type AuditingDocument = HydratedDocument<Auditing>;

export enum OP {
  Create = "create",
  Update = "update",
  Delete = "delete",
  Clone = "clone",
}

export enum Resource {
  ApplicationUser = "application_user",
  Classification = "classification",
  Domain = "domain",
  PermissionTable = "permission_table",
  Table = "table",
  Task = "task",
  User = "user",
  PermissionGroup = "permission_group",
}

export enum Status {
  Success = "success",
  Error = "error",
}

@Schema({ _id: false })
class ResourceInfo {
  @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
  id: number | string;

  @Prop({ required: true })
  name: string;
}

@Schema({ collection: "auditing" })
export class Auditing {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true, enum: OP })
  operation: OP;

  @Prop({ required: true, enum: Resource })
  resource: Resource;

  @Prop({ required: true, enum: Status })
  status: Status;

  @Prop({ required: true })
  resource_info: ResourceInfo;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, type: [mongoose.Schema.Types.Mixed] })
  difference: Difference[];

  @Prop({ required: true })
  time: string;
}

export const AuditingSchema = SchemaFactory.createForClass(Auditing);
