import { DataGridPro, DataGridProProps, GridCellModes, GridCellModesModel, GridCellParams } from "@mui/x-data-grid-pro";
import { MouseEvent, useCallback, useState } from "react";

const SingleClickEditingDataGrid = (props: DataGridProProps) => {
  const [cellModesModel, setCellModesModel] = useState<GridCellModesModel>({});
  const handleCellClick = useCallback((params: GridCellParams, event: MouseEvent) => {
    const { id, field, isEditable } = params;

    if (!isEditable) return;

    // Ignore portal
    if ((event.target as any)?.nodeType === 1 && !event.currentTarget.contains(event.target as Element)) return;

    setCellModesModel((prevModel) => {
      return {
        ...prevModel,
        [id]: {
          ...prevModel[id],
          // Change the current cell to edit mode
          [field]: { mode: GridCellModes.Edit },
        },
      };
    });
  }, []);

  const handleCellModesModelChange = useCallback((newModel: GridCellModesModel) => {
    setCellModesModel(newModel);
  }, []);

  return (
    <DataGridPro
      cellModesModel={cellModesModel}
      onCellModesModelChange={handleCellModesModelChange}
      onCellClick={handleCellClick}
      {...props}
    />
  );
};

export default SingleClickEditingDataGrid;
