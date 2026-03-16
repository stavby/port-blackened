export type ClassificationDBModel = {
  _id: string;
  name: string;
  description: string;
};

export type DomainRowFilterDBModel = {
  kod: string;
  display_name: string;
  type: string;
}[];

export type DomainDBModel = {
  _id: string;
  name: string;
  display_name?: string;
  permission_keys?: Record<string, string>;
  permission_table?: string;
  classifications: Array<string>;
  row_filters?: Array<DomainRowFilterDBModel>;
  tables?: Array<string>;
  not_for_use?: boolean;
  status?: number;
};
