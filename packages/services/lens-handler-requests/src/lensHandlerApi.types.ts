import { PreferredUsername } from "@port/common-schemas";
import { SchemaColumn } from "./utils.ts";

type Application = "connect" | "remix" | "external";

interface IDatasetColumn {
  column_name: string;
  column_desc: string;
  lens_data_type: string;
  column_display_name: string;
  is_key: boolean;
}

interface DatasetOwner {
  id: string;
  name?: string;
  ownershipType?: string;
}

// interface DatasetStats {
//   lastIngested?: number;
//   rowCount?: number;
// }

interface Dataset {
  url: string;
  tableName: string;
  tableSchema: string;
  tableDisplayName: string;
  tableDescription: string;
  application: Application;
  processType: string;
  schedule: string;
  owners: DatasetOwner[];
  isDeprecated: boolean;
  domain_id?: string;
  domain: string;
  isVerified: boolean;
  isTestConnection: boolean;
  // stats?: DatasetStats;
}

interface DatasetWithSchema extends Dataset {
  schema: IDatasetColumn[];
}

interface OfferedDisplayName {
  displayName: string;
  isAccurate: boolean;
}

interface OfferedDisplayNameForColumns {
  [column: string]: OfferedDisplayName;
}

type FormatDatasetReturn<withSchema extends boolean | undefined> = withSchema extends true ? DatasetWithSchema : Dataset;

interface FineGrainedLineage {
  upstreams: {
    tableName: string;
    column: string;
  }[];
  downstream: {
    tableName: string;
    column: string;
  };
}

interface LineageRelationship {
  url: string;
  tableName: string;
  owners?: {
    id: PreferredUsername;
    name: string;
    ownershipType: string;
  }[];
  fineGrainedLineages?: FineGrainedLineage[];
  upstreams?: LineageRelationship[];
  downstreams?: LineageRelationship[];
}

interface GetLineage {
  url: string;
  tableName: string;
  tableDisplayName: string;
  tableDescription: string;
  owners: {
    id: PreferredUsername;
    name: string;
    ownershipType: string;
  }[];
  fineGrainedLineages: FineGrainedLineage[];
  upstreams: LineageRelationship[];
  downstreams: LineageRelationship[];
}

type GetSchema = {
  schema: SchemaColumn[];
  alertColumns: string[];
};

export type {
  Application,
  Dataset,
  DatasetWithSchema,
  FormatDatasetReturn,
  IDatasetColumn,
  OfferedDisplayName,
  OfferedDisplayNameForColumns,
  GetLineage,
  GetSchema,
};
