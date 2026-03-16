import { useGridApiRef } from "@mui/x-data-grid-pro";

export const useGridExternalQuickFilter = () => {
  const gridApiRef = useGridApiRef();

  const handleSearch = (newSearchTerm: string) => {
    gridApiRef.current.setQuickFilterValues(newSearchTerm.split(" ").filter((word) => word !== ""));
  };

  return { gridApiRef, handleSearch };
};
