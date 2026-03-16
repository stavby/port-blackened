import { ClassificationState } from "@constants/ClassificationState";
import { ObjectIdBrand, VerificationStage } from "@port/shield-schemas";
import { ClassificationDBModel } from ".";

export type TableAttributes = {
  domain_id: ObjectIdBrand;
  domain: string;
  display_name: string;
};

// key: permission_key_name, value: column_name
export type TablePermissionKeys = Record<string, string>;

export type MaskType = "hash" | "null" | "none" | "";

export type ColumnAttributes = {
  data_type: string;
  data_type_hebrew?: string;
  column_display_name: string;
  column_desc?: string;
  classification?: ObjectIdBrand;
  mask?: MaskType;
};

export type EditableColumnAttributes = Pick<ColumnAttributes, "classification" | "mask">;

export type Column = {
  column_name: string;
  attributes: ColumnAttributes;
};

export type EditableColumn = Omit<Column, "attributes"> & {
  attributes: EditableColumnAttributes;
};

// key: column_name
export type ColumnsDict = Record<string, Column>;
export type EditableColumnsDict = Record<string, EditableColumn>;

export type Table = {
  _id: string;
  table_name: string;
  table_display_name: string;
  table_desc: string;
  attributes: TableAttributes;
  permission_keys: TablePermissionKeys;
  columns_dict: ColumnsDict;
  source_type: string;
  connection_display_name?: string;
  verification_stages?: VerificationStage[];
  last_verification_time?: Date;
};

export type GetTablesDto = Pick<
  Table,
  | "_id"
  | "table_name"
  | "table_display_name"
  | "table_desc"
  | "source_type"
  | "connection_display_name"
  | "verification_stages"
  | "last_verification_time"
> & {
  domain_display_name: string;
  domain_id: string;
  classificationState: ClassificationState;
  is_sap: boolean;
};

export type TableDto = {
  _id: string;
  table_name: string;
  columns_dict: Record<string, Column>;
  permission_keys: TablePermissionKeys;
  source_type: string;
  connection_display_name?: string;
  is_sap?: boolean;
  verification_stages?: VerificationStage[];
  last_verification_time?: Date;
};

export type GetTableByIdDto = {
  table: TableDto;
  classifications: {
    all: ClassificationDBModel[];
    user: ClassificationDBModel[];
  };
};

export type GetTableSuggestionsDto = {
  column_classifications: { [column: string]: string };
};
