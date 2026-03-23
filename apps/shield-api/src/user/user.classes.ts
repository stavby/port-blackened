import { PickType } from "@nestjs/swagger";
import { UserID, UserIDTransform } from "@port/common-schemas";
import { columns_dict_preview_dto, FilterUserSchema, getUserPreviewSchema, userTypes } from "@port/shield-schemas";
import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { ObjectId } from "mongodb";
import { createZodDto } from "nestjs-zod";
import { RowFilter } from "src/permission_tables/permission_tables.classes";
import { objectIdToString, TransformToMongoObjectId, withObjectIdTransform } from "src/utils/mongo.utils";
import { IsNotEmptyString, IsObjectType } from "src/utils/validation/validation.decorators";

export type UserType = (typeof userTypes)[number];

class UserCatalogSchema {
  @IsString()
  schema_name: string;

  @IsBoolean()
  write: boolean;
}

export class UserCatalog {
  @IsOptional()
  @IsBoolean()
  read_all?: boolean;

  @IsOptional()
  @IsBoolean()
  write?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserCatalogSchema)
  schemas?: UserCatalogSchema[];
}

export class UserImpersonate {
  @IsBoolean()
  value: boolean;

  @IsOptional()
  @IsNotEmptyString()
  impersonate_expression?: string; // only if value is true
}

export class UserAttributes {
  @IsIn(userTypes)
  type: UserType;

  @IsBoolean()
  mask: boolean;

  // backportability for previous boolean values to map into empty arrays
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  @IsNumber({}, { each: true })
  @ArrayUnique()
  unique_population: number[];

  @IsBoolean()
  deceased_population: boolean;

  @IsObjectType(UserImpersonate)
  impersonate: UserImpersonate;

  @IsOptional()
  @IsBoolean()
  blocked?: boolean;
}

export class UserDomain {
  @TransformToMongoObjectId()
  id: ObjectId;

  @TransformToMongoObjectId({ isArray: true })
  @ArrayUnique(objectIdToString)
  classifications: ObjectId[];

  @IsOptional()
  @IsNotEmptyString()
  given_by?: UserID;

  @IsOptional()
  @IsNotEmptyString()
  last_changed_by?: UserID;

  @IsOptional()
  @IsDate()
  last_change?: Date;

  @IsOptional()
  @IsDate()
  create_date?: Date;
}

export class UserRowFilterValue {
  @IsNotEmpty()
  value: string | number;

  @IsNotEmptyString()
  display_name: string;
}

export class UserRowFilter extends PickType(RowFilter, ["kod"]) {
  @IsObjectType(UserRowFilterValue, { isArray: true })
  values: UserRowFilterValue[];
}

export class UserPermissionTable {
  @TransformToMongoObjectId()
  id: ObjectId;

  @ArrayNotEmpty()
  @IsObjectType(UserRowFilter, { isArray: true })
  @ArrayUnique((obj) => obj.kod)
  row_filters: UserRowFilter[];

  @IsOptional()
  @IsNotEmptyString()
  given_by?: string;

  @IsOptional()
  @IsNotEmptyString()
  last_changed_by?: string;

  @IsOptional()
  @IsDate()
  last_change?: Date;

  @IsOptional()
  @IsDate()
  create_date?: Date;
}

export class UserPermissionGroup {
  @TransformToMongoObjectId()
  id: ObjectId;

  @IsNotEmptyString()
  given_by: UserID;

  @IsDate()
  registration_date: Date;
}

export class User {
  @IsNotEmptyString()
  @UserIDTransform()
  user_id: UserID;

  @IsOptional()
  @IsNotEmptyString()
  first_name?: string;

  @IsOptional()
  @IsNotEmptyString()
  last_name?: string;

  @IsObject()
  catalogs: Record<string, UserCatalog>;

  @IsObjectType(UserAttributes)
  attributes: UserAttributes;

  @ArrayNotEmpty()
  @IsObjectType(UserDomain, { isArray: true })
  @ArrayUnique((obj) => objectIdToString(obj.id))
  domains: UserDomain[];

  @ArrayNotEmpty()
  @IsObjectType(UserPermissionTable, { isArray: true })
  @ArrayUnique((obj) => objectIdToString(obj.id))
  permission_tables: UserPermissionTable[];

  @IsObjectType(UserPermissionGroup, { isArray: true })
  @ArrayUnique((obj) => objectIdToString(obj.permission_group_id))
  permission_groups: UserPermissionGroup[];

  @IsOptional()
  @IsBoolean()
  is_read_all?: boolean;
}

export class ZFilterUsersDto extends createZodDto(withObjectIdTransform(FilterUserSchema)) {}
export class ZGetTableColumnDictDto extends createZodDto(withObjectIdTransform(columns_dict_preview_dto)) {}

export class ZGetUserPreviewDto extends createZodDto(withObjectIdTransform(getUserPreviewSchema)) {}
