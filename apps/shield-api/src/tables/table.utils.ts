import { AnyOwner, CreateEvent } from "@port/common-schemas";
import {
  ColumnDictDiff,
  Table,
  TableAuthColumnDiff,
  TableAuthKeyDiff,
  TableDiff,
  TableDomainDiff,
  TableFullVerificationDiff,
  TablePermissionTableDiff,
  TableVerificationStageDiff,
} from "@port/shield-models";
import { isDataVerified, SpyglassUpsertTable, VERIFICATION_STAGE_NAMES, VerificationStage } from "@port/shield-schemas";
import { ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { formatRawStandardTable } from "src/utils/utils";
import { EditableColumnsDict } from "./table.classes";
import { DEFAULT_MASK } from "./table.constants";
import { InternalServerErrorException } from "@nestjs/common";

export const getColumnsDictDiff = (currColumnsDict: EditableColumnsDict, newColumnsDict: EditableColumnsDict): ColumnDictDiff[] => {
  const newSchema = Object.values(newColumnsDict);

  return newSchema.reduce<ColumnDictDiff[]>((acc, newColumn) => {
    const newClassification = newColumn.attributes.classification ?? null;
    const newMask = newColumn.attributes.mask ?? null;
    const currColumn = currColumnsDict[newColumn.column_name];

    if (currColumn) {
      const currClassification = currColumn.attributes.classification ?? null;
      const isClassificationChanged = currClassification
        ? !currClassification.equals(newClassification)
        : currClassification !== newClassification;

      if (isClassificationChanged) {
        acc.push({
          kind: "classification",
          column_name: currColumn.column_name,
          oldValue: currClassification,
          newValue: newClassification,
        });
      }

      const currMask = currColumn.attributes.mask ?? null;
      const isMaskChanged = currMask !== newMask;

      if (isMaskChanged) {
        acc.push({
          kind: "mask",
          column_name: currColumn.column_name,
          oldValue: currMask,
          newValue: newMask,
        });
      }
    } else {
      if (newClassification) {
        acc.push({
          kind: "classification",
          column_name: newColumn.column_name,
          oldValue: null,
          newValue: newClassification,
        });
      }

      if (newMask && newMask !== DEFAULT_MASK) {
        acc.push({
          kind: "mask",
          column_name: newColumn.column_name,
          oldValue: null,
          newValue: newMask,
        });
      }
    }

    return acc;
  }, []);
};

export const getVerificationDiff = (oldStages?: VerificationStage[], newStages?: VerificationStage[]): TableVerificationStageDiff[] => {
  const checked = (newStages || [])
    .filter(({ stage, is_checked }) => is_checked && !oldStages?.find(({ stage: old_stage }) => old_stage === stage)?.is_checked)
    .map(({ stage }) => ({ kind: "verification_stages", stage, action: "checked" }) satisfies TableVerificationStageDiff);

  const unchecked = (oldStages || [])
    .filter(({ stage, is_checked }) => is_checked && !newStages?.find(({ stage: new_stage }) => new_stage === stage)?.is_checked)
    .map(({ stage }) => ({ kind: "verification_stages", stage, action: "unchecked" }) satisfies TableVerificationStageDiff);

  return [...checked, ...unchecked];
};

export const getFullVerificationDiff = (oldStages: VerificationStage[], newStages: VerificationStage[]): TableFullVerificationDiff[] => {
  const wasVerified = isDataVerified(newStages) && !isDataVerified(oldStages);
  const wasUnverified = !isDataVerified(newStages) && isDataVerified(oldStages);

  if (wasVerified) {
    return [{ kind: "full_verification", oldValue: false, newValue: true }];
  }
  if (wasUnverified) {
    return [{ kind: "full_verification", oldValue: true, newValue: false }];
  }
  return [];
};

@ValidatorConstraint()
export class IsUniqueByStage implements ValidatorConstraintInterface {
  validate(verification_stages: VerificationStage[]): boolean {
    const stageNames = verification_stages.map(({ stage }) => stage);
    return stageNames.length === new Set(stageNames).size;
  }
}

@ValidatorConstraint()
export class IsAllStagesExist implements ValidatorConstraintInterface {
  validate(verification_stages: VerificationStage[]): boolean {
    const stageNames = verification_stages.map(({ stage }) => stage);

    return VERIFICATION_STAGE_NAMES.every((stage) => stageNames.includes(stage));
  }
}
export const getTablesDiff = ({
  newTable,
  currTable,
}: {
  newTable: Pick<Table, "attributes" | "permission_table" | "columns_dict" | "permission_keys">;
  currTable: Pick<Table, "attributes" | "permission_table" | "columns_dict" | "permission_keys"> | null;
}): TableDiff[] => {
  const diffs: TableDiff[] = [];

  const columnsDictDiffs = getColumnsDictDiff(
    currTable ? Object.fromEntries(currTable.columns_dict.entries()) : {},
    Object.fromEntries(newTable.columns_dict.entries()),
  );

  diffs.push(...columnsDictDiffs);

  if (!currTable || !newTable.attributes.domain_id.equals(currTable.attributes.domain_id)) {
    diffs.push({
      kind: "domain",
      oldValue: currTable?.attributes.domain_id ?? null,
      newValue: newTable.attributes.domain_id ?? null,
    } satisfies TableDomainDiff);
  }

  if ((currTable?.permission_table || newTable.permission_table) && !newTable.permission_table?.equals(currTable?.permission_table)) {
    diffs.push({
      kind: "permission_table",
      oldValue: currTable?.permission_table ?? null,
      newValue: newTable.permission_table ?? null,
    } satisfies TablePermissionTableDiff);
  }

  const currAuthKey = currTable?.permission_keys.keys().next().value ?? null;
  const newAuthKey = newTable.permission_keys.keys().next().value ?? null;
  const currAuthColumn = currAuthKey ? (currTable?.permission_keys.get(currAuthKey) ?? null) : null;
  const newAuthColumn = newAuthKey ? (newTable.permission_keys.get(newAuthKey) ?? null) : null;

  if (currAuthKey !== newAuthKey) {
    diffs.push({
      kind: "auth_key",
      oldValue: currAuthKey,
      newValue: newAuthKey,
    } satisfies TableAuthKeyDiff);
  }

  if (currAuthColumn !== newAuthColumn) {
    diffs.push({
      kind: "auth_column",
      oldValue: currAuthColumn,
      newValue: newAuthColumn,
    } satisfies TableAuthColumnDiff);
  }

  return diffs;
};

export const upsertTableToSpyglassEvent = (
  data: SpyglassUpsertTable & {
    domain_display_name: string;
    owner: AnyOwner;
    co_owners?: AnyOwner[];
  },
): CreateEvent => {
  const event = {
    event_type: "create_dataset",
    domain_display_name: data.domain_display_name,
    domain_id: data.domain_id,
    fully_qualified_table_name: formatRawStandardTable(data),
    schema: data.schema,
    table_display_name: data.table_display_name,
    table_desc: data.table_desc,
    owner: data.owner,
    co_owners: "co_owners" in data ? (data.co_owners ?? []) : [],
  } as const satisfies Partial<CreateEvent>;

  const application = data.application;

  if (application === "connect") {
    return { ...event, application: "connect", process_type: data.process_type, schedule_interval: data.schedule };
  }
  const queryBasedData = {
    sql_query: data.query,
    schedule_type: data.schedule_type,
    dependencies: data.updating_dependencies ?? [],
    all_dependencies: data.all_dependencies,
    schedule_interval: data.schedule ?? "",
  } as const satisfies Partial<CreateEvent>;
  if (application === "remix") {
    return { application: "remix", ...event, ...queryBasedData };
  }
  if (application === "external") {
    return { application: "external", ...event, ...queryBasedData, process_type: data.process_type };
  }

  throw new InternalServerErrorException(`Unknown application type: ${application satisfies never}`);
};
