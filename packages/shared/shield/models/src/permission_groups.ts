import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseUserAttributes, UserDomain, UserPermissionTable } from "./user";

@Schema({ _id: false })
export class PermissionGroupPermissionTable extends UserPermissionTable {
  // @Prop({
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: PermissionTable.name,
  //   required: true,
  // })
  // id: mongoose.Types.ObjectId;
}

@Schema({ _id: false })
export class PermissionGroupDomain extends UserDomain {
  // @Prop({
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: Domain.name,
  //   required: true,
  // })
  // id: mongoose.Types.ObjectId;
  // @Prop({
  //   type: [
  //     {
  //       type: mongoose.Schema.Types.ObjectId,
  //       ref: Classification.name,
  //       required: true,
  //     },
  //   ],
  //   required: true,
  // })
  // classifications: mongoose.Types.ObjectId[];
}

@Schema({ _id: false })
export class PermissionGroupAttributes extends BaseUserAttributes {}

@Schema({ collection: "permission_groups" })
export class PermissionGroup {
  @Prop({ unique: true, required: true })
  name: string;

  @Prop({ required: true })
  ownerId: string;

  @Prop({ required: true })
  ownerName: string;

  @Prop({ required: false, default: "" })
  description: string;

  @Prop({ required: true })
  color: string;

  @Prop({
    required: true,
    type: [
      raw({
        userId: String,
        userName: String,
      }),
    ],
  })
  coOwners: { userId: string; userName: string }[];

  @Prop({ required: true, type: PermissionGroupAttributes })
  attributes: PermissionGroupAttributes;

  @Prop({ required: true, type: [PermissionGroupDomain] })
  domains: PermissionGroupDomain[];

  @Prop({ required: true, type: [PermissionGroupPermissionTable] })
  permission_tables: PermissionGroupPermissionTable[];
}

export const PermissionGroupSchema = SchemaFactory.createForClass(PermissionGroup);
