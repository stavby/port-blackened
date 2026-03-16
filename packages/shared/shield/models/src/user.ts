import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Classification } from "./classification";
import { Domain } from "./domain";
import { PermissionTable, RowFilter } from "./permission_table";
import { PickType } from "@nestjs/swagger";

const userTypes = ["לקוח קצה", 'קפ"ט', "חוקר", "מערכת"] as const;
export type UserType = (typeof userTypes)[number];

@Schema({ _id: false })
export class UserImpersonate {
  @Prop({ required: true })
  value: boolean;

  @Prop({ required: false })
  impersonate_expression?: string; // only if value is true
}

@Schema({ _id: false })
class UserCatalogSchemas {
  @Prop({ required: true })
  schema_name: string;

  @Prop({ required: true })
  write: boolean;
}

@Schema({ _id: false })
export class UserCatalog {
  @Prop({ required: false })
  write?: boolean;

  @Prop({ required: false })
  read_all?: boolean;

  @Prop({ type: [UserCatalogSchemas], required: false })
  schemas?: UserCatalogSchemas[];
}

const UserCatalogSchema = SchemaFactory.createForClass(UserCatalog);

export class BaseUserAttributes {
  @Prop({ required: true })
  mask: boolean;

  @Prop({ required: true })
  deceased_population: boolean;
}

@Schema({ _id: false })
export class UserAttributes extends BaseUserAttributes {
  @Prop({ required: true, enum: userTypes })
  type: UserType;

  @Prop({ required: true, type: [Number] })
  unique_population: number[];

  @Prop({ type: UserImpersonate, required: true })
  impersonate: UserImpersonate;

  @Prop({ required: false })
  blocked?: boolean;
}

@Schema({ _id: false })
export class UserDomain implements Pick<Domain, "classifications"> {
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
        ref: Classification.name,
        required: true,
      },
    ],
    required: true,
  })
  classifications: mongoose.Types.ObjectId[];

  @Prop({ required: false })
  given_by?: string;

  @Prop({ required: false, type: Date })
  create_date?: Date;

  @Prop({ required: false })
  last_changed_by?: string;

  @Prop({ required: false, type: Date })
  last_change?: Date;
}

export type RowFilterValueType = number | string;

@Schema({ _id: false })
export class UserRowFilterValue {
  @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
  value: RowFilterValueType;

  @Prop({ required: true })
  display_name: string;
}

@Schema({ _id: false })
export class UserRowFilter implements Pick<RowFilter, "kod"> {
  @Prop({ required: true })
  kod: string;

  @Prop({ type: [UserRowFilterValue], required: true })
  values: UserRowFilterValue[];
}

@Schema({ _id: false })
export class UserPermissionTable {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: PermissionTable.name,
    required: true,
  })
  id: mongoose.Types.ObjectId;

  @Prop({ type: [UserRowFilter], required: true })
  row_filters: UserRowFilter[];

  @Prop()
  given_by?: string;

  @Prop()
  last_changed_by?: string;

  @Prop({ type: Date })
  last_change?: Date;

  @Prop({ type: Date })
  create_date?: Date;
}

@Schema({ _id: false })
export class UserPermissionGroups {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Domain.name,
    required: true,
  })
  id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  given_by: string;

  @Prop({ type: Date, required: true })
  registration_date: Date;
}

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ unique: true, required: true })
  user_id: string;

  @Prop({ required: false })
  first_name?: string;

  @Prop({ required: false })
  last_name?: string;

  @Prop({ type: Map, of: UserCatalogSchema, required: true })
  catalogs: Map<string, UserCatalog>;

  @Prop({ type: UserAttributes, required: true })
  attributes: UserAttributes;

  @Prop({ type: [UserDomain], required: true })
  domains: UserDomain[];

  @Prop({ type: [UserPermissionTable], required: true })
  permission_tables: UserPermissionTable[];

  @Prop({ type: [UserPermissionGroups], required: true })
  permission_groups: UserPermissionGroups[];
}

export const UserSchema = SchemaFactory.createForClass(User);
