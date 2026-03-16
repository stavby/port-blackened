import { PickType } from "@nestjs/swagger";
import { upsertTableResponseSchema, refinedUpsertExternalTablesSchema, refinedUpsertInternalTablesSchema, VerificationStage } from "@port/shield-schemas";
import { IsOptional, Validate } from "class-validator";
import { WithId } from "mongodb";
import { createZodDto } from "nestjs-zod";
import { Classification } from "src/classifications/classifications.classes";
import { ValidateRecord } from "src/utils/validation/recordValidator";
import { IsObjectType } from "src/utils/validation/validation.decorators";
import { Column, ColumnAttrs, EditableColumn, EditableColumnsDict, TableWithSapIndication } from "./table.classes";
import { ClassificationState } from "./table.constants";
import { IsAllStagesExist, IsUniqueByStage } from "./table.utils";
import { formatRawStandardTable, shieldStandardTableSchema } from "src/utils/utils";

export class EditTableDto {
  @ValidateRecord(EditableColumn)
  columns_dict: EditableColumnsDict;

  @IsObjectType(VerificationStage, { isArray: true })
  @Validate(IsUniqueByStage, { message: "Duplicate verification stages found" })
  @Validate(IsAllStagesExist, { message: "Some verification stages are missing" })
  @IsOptional()
  verification_stages?: VerificationStage[];
}

export class GetTablesDto extends PickType(TableWithSapIndication, [
  "table_name",
  "table_display_name",
  "table_desc",
  "source_type",
  "is_sap",
  "connection_display_name",
  "verification_stages",
  "last_verification_time",
]) {
  _id: string;
  domain_display_name: string;
  domain_id: string;
  classificationState: ClassificationState;
}

export interface ColumnAttrsDto extends ColumnAttrs {
  data_type_hebrew: string;
}

export interface ColumnDto extends Omit<Column, "attributes"> {
  attributes: ColumnAttrsDto;
}

export interface GetTableDto
  extends Pick<
    WithId<TableWithSapIndication>,
    "_id" | "table_name" | "attributes" | "source_type" | "verification_stages" | "last_verification_time" | "is_sap"
  > {
  columns_dict: Record<string, ColumnDto>;
}

export class GetTableByIdDto {
  table: GetTableDto;
  classifications: {
    all: WithId<Classification>[];
    user: WithId<Classification>[];
  };
}

export class GetTableSuggestionsDto {
  column_classifications: { [column: string]: string };
}

const deprecateTablesSchema = shieldStandardTableSchema
  .array()
  .refine((tables) => new Set(tables.map(formatRawStandardTable)).size === tables.length, { message: "Tables must be unique" });

export class DeprecateTablesDto extends createZodDto(deprecateTablesSchema) { }

export class UpsertExternalTablesDto extends createZodDto(refinedUpsertExternalTablesSchema) { }

export class UpsertInternalTablesDto extends createZodDto(refinedUpsertInternalTablesSchema) { }

export class UpsertTableResponseDto extends createZodDto(upsertTableResponseSchema) { }
