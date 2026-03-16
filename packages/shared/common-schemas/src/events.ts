import { ColumnSchema, Dataset } from "./datasets.ts";
import { AnyOwner } from "./users.ts";

type Application = "connect" | "remix" | "external";

type CreateEventCommon = {
  event_type: "create_dataset";
  fully_qualified_table_name: string;
  table_display_name: string;
  table_desc: string;
  schema: ColumnSchema[];
  domain_id: string;
  domain_display_name: string;
  owner: AnyOwner;
  co_owners: AnyOwner[];

  application: Application;
};

type CreateEventConnect = {
  application: "connect";
  schedule_interval: string;

  process_type: NonNullable<Dataset["process_type"]>;
};

type CreateEventRemix = {
  application: "remix";
  schedule_interval?: string;

  sql_query: string;
  schedule_type: "and" | "or" | "cron";
  dependencies: string[];
  all_dependencies: string[];
};

type CreateEventExternal = Omit<CreateEventRemix, "application"> & {
  application: "external";
  process_type: NonNullable<Dataset["process_type"]>;
};

export type CreateEvent = CreateEventCommon & (CreateEventConnect | CreateEventRemix | CreateEventExternal);

export class DeleteEvent {
  event_type: "delete_dataset";
  fully_qualified_table_name: string;

  constructor(fully_qualified_table_name: string) {
    this.event_type = "delete_dataset";
    this.fully_qualified_table_name = fully_qualified_table_name;
  }
}

enum ClassificationState {
  UNCLASSIFIED = "unclassified",
  PARTIALLY_CLASSIFIED = "partially_classified",
  CLASSIFIED = "classified",
  INTERNALLY_CLASSIFIED = "internally_classified",
}

type ColumnTagDiff = {
  add: string[];
  remove: string[];
};

export type ClassificationStateEvent = {
  event_type: "classification_state";
  fully_qualified_table_name: string;
  classification_state: ClassificationState;
  columns_tag_diff: Record<string, ColumnTagDiff>;
};

export type DomainOwnersEvent = {
  event_type: "domain_owners";
  domain_id: string;
  domain_display_name: string;
  owners: string[];
};

export type SpecialTagEvent = {
  event_type: "special_tag_dataset";
  fully_qualified_table_name: string;
  tag_name: string;
  is_append: boolean;
};
