export const EXCEL_CONTENT_TYPE_HEADER = {
  headerName: "Content-Type",
  headerValue: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

export const EXCEL_CONTENT_DISPOSITION = {
  headerName: "Content-Disposition",
  headerValue: <const T extends string>(fileName: T) => `attachment; filename="${fileName}"` as const,
} as const;
