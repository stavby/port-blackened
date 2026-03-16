// Extra Common Types (here for now, move to a different types package in future)
export type StandardTable = {
  tableSchema: string;
  tableName: string;
};

export type SchemaColumn = {
  column_name: string;
  data_type: string;
  column_display_name: string;
  column_desc?: string | null;
  is_key: boolean;
};
