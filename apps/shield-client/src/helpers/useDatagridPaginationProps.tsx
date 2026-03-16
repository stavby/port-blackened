import { DataGridProProps } from "@mui/x-data-grid-pro";
import { useMemo } from "react";

export function useDatagridPaginationProps<const T extends number[]>(options?: {
  pageSizes: T;
  initialPageSize: T[number];
}): Pick<DataGridProProps, "initialState" | "pageSizeOptions" | "pagination"> {
  const initialState = useMemo<DataGridProProps["initialState"]>(
    () => ({ pagination: { paginationModel: { pageSize: options?.initialPageSize ?? 10 } } }),
    [options?.initialPageSize],
  );
  const pageSizeOptions = useMemo<DataGridProProps["pageSizeOptions"]>(() => options?.pageSizes ?? [10, 25, 50, 100], [options?.pageSizes]);

  return { initialState, pageSizeOptions, pagination: true };
}
