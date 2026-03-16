import { ColumnAttributes } from "@port/shield-models";
import { UpsertExternalTablesDto, UpsertInternalTablesDto } from "./table.dto";
import { Dataset } from "@port/common-schemas";

type BaseTableDiff = {
  column_name: string;
};

type ClassificationTableDiff = BaseTableDiff & {
  field: "classification";
  oldValue: ColumnAttributes["classification"];
  newValue: ColumnAttributes["classification"];
};

type MaskTableDiff = BaseTableDiff & {
  field: "mask";
  oldValue: ColumnAttributes["mask"];
  newValue: ColumnAttributes["mask"];
};

export type TableDiff = ClassificationTableDiff | MaskTableDiff;

export type UpsertTable = UpsertExternalTablesDto[number] | UpsertInternalTablesDto[number]

export type UpsertTableWithOwner = UpsertTable & Pick<Dataset, "owner"> 