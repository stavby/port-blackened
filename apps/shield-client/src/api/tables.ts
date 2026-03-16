import { TABLES_ENDPOINT, TABLES_EXCEL_ENDPOINT } from "@constants";
import { EXCEL_ACCEPT_HEADER } from "@constants/excel";
import { VerificationStage } from "@port/shield-schemas";
import { EditableColumnsDict, GetTableByIdDto, GetTableSuggestionsDto, GetTablesDto } from "@types";
import axios from "axios";

export const getTables: () => Promise<GetTablesDto[]> = async () => {
  const { data } = await axios.get<GetTablesDto[]>(TABLES_ENDPOINT);
  return data;
};

export const getTableById: (id: string) => Promise<GetTableByIdDto> = async (id: string) => {
  const { data } = await axios.get<GetTableByIdDto>(`${TABLES_ENDPOINT}/id/${id}`);
  return data;
};

export const getTableSuggestionsById: (id: string) => Promise<GetTableSuggestionsDto> = async (id: string) => {
  const { data } = await axios.get<GetTableSuggestionsDto>(`${TABLES_ENDPOINT}/id/${id}/suggestions`);
  return data;
};

export const editTable = async (
  tableId: string,
  body: { columns_dict: EditableColumnsDict; verification_stages?: VerificationStage[] | null },
) => {
  await axios.put(`${TABLES_ENDPOINT}/id/${tableId}`, body);
};

export const getTablesExcel = async () => {
  const { data } = await axios.get(TABLES_EXCEL_ENDPOINT, {
    responseType: "blob",
    headers: EXCEL_ACCEPT_HEADER,
  });

  return data;
};
