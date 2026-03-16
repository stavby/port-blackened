import { OmitType, PickType } from "@nestjs/swagger";
import { Dataset } from "@port/common-schemas";
import { MaskType, maskTypes } from "@port/shield-models";
import { VerificationStage } from "@port/shield-schemas";
import { IsArray, IsBoolean, IsIn, IsObject, IsOptional, IsString } from "class-validator";
import { ObjectId } from "mongodb";
import { TransformToMongoObjectId } from "src/utils/mongo.utils";
import { ValidateRecord } from "src/utils/validation/recordValidator";
import { IsNotEmptyString, IsObjectType } from "src/utils/validation/validation.decorators";

export class TableAttributes {
  @TransformToMongoObjectId()
  domain_id: ObjectId;

  @IsNotEmptyString()
  domain: string;

  @IsNotEmptyString()
  display_name: string;
}

// key: permission_key_name, value: column_name
export type TablePermissionKeys = Record<string, string>;

export class ColumnAttrs {
  @IsNotEmptyString()
  data_type: string;

  @IsString()
  column_display_name: string;

  @IsString()
  column_desc: string;

  @IsOptional()
  @TransformToMongoObjectId()
  classification?: ObjectId;

  @IsOptional()
  @IsIn(maskTypes)
  mask?: MaskType;
}

export class EditableColumnAttrs extends PickType(ColumnAttrs, ["classification", "mask"]) {}

export class Column {
  @IsNotEmptyString()
  column_name: string;

  @IsObjectType(ColumnAttrs)
  attributes: ColumnAttrs;
}

export class EditableColumn extends OmitType(Column, ["attributes"]) {
  @IsObjectType(EditableColumnAttrs)
  attributes: EditableColumnAttrs;
}

// key: column_name
export type ColumnsDict = Record<string, Column>;
export type EditableColumnsDict = Record<string, EditableColumn>;

export class Table {
  @IsNotEmptyString()
  catalog_name: string;

  @IsNotEmptyString()
  schema_name: string;

  @IsNotEmptyString()
  table_name: string;

  @IsString()
  table_display_name: string;

  @IsString()
  table_desc: string;

  @IsString()
  owner: string;

  @IsObjectType(TableAttributes)
  attributes: TableAttributes;

  @IsObject()
  permission_keys: TablePermissionKeys;

  @ValidateRecord(Column)
  columns_dict: ColumnsDict;

  @IsString()
  application: Dataset["application"];

  @IsString()
  source_type: string;

  @TransformToMongoObjectId()
  permission_table: ObjectId;

  @IsOptional()
  connection_display_name?: string;

  @IsOptional()
  verification_stages?: VerificationStage[];

  @IsOptional()
  last_verification_time?: Date;

  @IsOptional()
  is_deprecated?: boolean;
}

export class TableWithSapIndication extends Table {
  is_sap: boolean;
}

export class RawStandardTablesBody {
  @IsArray()
  @IsString({ each: true })
  tables: string[];
}

export class TableWithPermissionTableName extends OmitType(Table, ["permission_table"]) {
  @IsNotEmptyString()
  permission_table_name: string;
}

// key: catalog.schema.table
export type TablesDictionary = Record<string, TableWithPermissionTableName>;
// key: schema, value: [table1, table2, ...]
export type SchemasDictionary = Record<string, string[]>;
