import { Injectable } from "@nestjs/common";
import * as XLSX from "xlsx";

@Injectable()
export class ExcelService {
  constructor() {}

  convertToExcel<const R extends Record<string, any>>(
    rows: R[],
    columns: { name: keyof R; displayName: string; options?: XLSX.ColInfo }[],
    isRtl = true,
  ): unknown {
    const worksheetData: unknown[][] = [];
    const headers: string[] = [];
    const columnsOptions: XLSX.ColInfo[] = [];

    columns.forEach((column) => {
      headers.push(column.displayName);
      columnsOptions.push(column.options ?? {});
    });

    worksheetData.push(headers);

    rows.forEach((row) => {
      const rowData = columns.map((column) => row[column.name]);
      worksheetData.push(rowData);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = columnsOptions;

    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: isRtl }] };

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsb" });
  }
}
