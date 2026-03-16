import { useTheme } from "@mui/material";
import { DataGridPro, DataGridProProps, GridRowSelectionModel, GridValidRowModel, gridClasses, heIL } from "@mui/x-data-grid-pro";
import SingleClickEditingDataGrid from "./SingleClickEditingDataGrid";
import { mergeSx } from "@helpers/mergeSx";

export type SelectionModel = string[];

type ProProps<R extends GridValidRowModel> = DataGridProProps<R> & {
  checkboxSelection?: boolean;
  selectedRows?: SelectionModel;
  setSelectedRows?: React.Dispatch<React.SetStateAction<SelectionModel>>;
  footer?: () => JSX.Element;
  isSingleClickEdit?: boolean;
};

const additonalSx = {
  [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within, 
& .${gridClasses.columnHeader}:focus-within, & .${gridClasses.columnHeader}:focus`]: {
    outline: "none",
  },
};

const EmptyRowOverLay = () => <></>;

export function DataGridProComponent<R extends GridValidRowModel>({
  rows,
  columns,
  checkboxSelection,
  selectedRows,
  setSelectedRows,
  footer,
  isSingleClickEdit,
  sx = {},
  slots: datagridSlots,
  ...dataGridProps
}: ProProps<R>) {
  function handleSelectionChange(newSelection: GridRowSelectionModel) {
    if (setSelectedRows) {
      const selectedIds: SelectionModel = newSelection.map((row) => row as string);
      setSelectedRows(selectedIds);
    }
  }

  const theme = useTheme();

  const props: DataGridProProps<R> = {
    rows,
    columns,
    checkboxSelection: checkboxSelection ?? false,
    rowSelectionModel: selectedRows,
    onRowSelectionModelChange: handleSelectionChange,
    slots: {
      footer: footer,
      noRowsOverlay: EmptyRowOverLay,
      noResultsOverlay: EmptyRowOverLay,
      ...datagridSlots,
    },
    getRowId: (row) => row._id,
    rowSelection: false,
    localeText: heIL.components.MuiDataGrid.defaultProps.localeText,
    sx: mergeSx(sx, additonalSx, theme),
    ...dataGridProps,
  };

  return isSingleClickEdit ? <SingleClickEditingDataGrid {...props} /> : <DataGridPro {...props} />;
}
