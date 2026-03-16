import { Select, SelectChangeEvent, SelectProps } from "@mui/material";
import { GridRenderEditCellParams, useGridApiContext } from "@mui/x-data-grid-pro";
import React, { useEffect, useRef } from "react";

interface CustomDatagridSelect<Value> {
  selectProps: SelectProps<Value>;
  gridProps: GridRenderEditCellParams;
  children: React.ReactNode;
}

export function CustomDatagridSelect<Value>({ selectProps, gridProps, children }: CustomDatagridSelect<Value>) {
  const { id, field, hasFocus } = gridProps;
  const gridApiRef = useGridApiContext();
  const selectRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (hasFocus) {
      selectRef.current?.focus();
    }
  }, [hasFocus]);

  const handleChange = (event: SelectChangeEvent<Value>, child: React.ReactNode) => {
    gridApiRef.current.setEditCellValue({ id, field, value: event.target.value });
    selectProps.onChange?.(event, child);
  };

  return (
    <Select {...selectProps} onChange={handleChange}>
      {children}
    </Select>
  );
}
