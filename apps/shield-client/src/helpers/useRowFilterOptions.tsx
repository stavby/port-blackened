import { getRowFiltersOptions } from "@api/permissionTable";
import { PERMISSION_TABLE_ENDPOINT } from "@constants";
import { useQuery } from "@tanstack/react-query";
import { RowFilterValue } from "@types";

export const useRowFilterOptions = <R extends RowFilterValue = RowFilterValue>(
  permissionTableId: string,
  rowFilterKod: string,
  onError?: (error: unknown) => void,
) => {
  const { data, ...rest } = useQuery({
    queryKey: [PERMISSION_TABLE_ENDPOINT, "id", permissionTableId, "row-filters", rowFilterKod],
    queryFn: async () => {
      try {
        return await getRowFiltersOptions<R>(permissionTableId, rowFilterKod);
      } catch (error) {
        onError?.(error);
        throw error;
      }
    },
    meta: {
      loading: false,
    },
  });

  return { ...rest, rowFilterValueOptions: data };
};
