import { Checkbox, FormControlLabel } from "@mui/material";
import React from "react";
import { FixedSizeList, ListChildComponentProps } from "react-window";

export interface CheckboxListItem<V = unknown> {
  value: V;
  label: string;
  disabled?: boolean;
}

interface CheckboxesFixedSizeListProps<V> {
  items: CheckboxListItem<V>[];
  checkedValues: Set<V>;
  handleCheckboxChange: (value: V, checked: boolean) => void;
}

const CheckboxesFixedSizeList = <V,>({ items, checkedValues, handleCheckboxChange }: CheckboxesFixedSizeListProps<V>) => {
  const Row: React.FC<ListChildComponentProps> = ({ index, style }) => {
    const item = items[index];
    return (
      item && (
        <FormControlLabel
          sx={{ ...style }}
          key={String(item.value)}
          value={item.value}
          label={item.label}
          control={
            <Checkbox
              checked={checkedValues.has(item.value)}
              onChange={(_, checked) => handleCheckboxChange(item.value, checked)}
              disabled={item.disabled}
              style={{ margin: 0 }}
            />
          }
        />
      )
    );
  };

  return (
    <FixedSizeList height={500} style={{ direction: "rtl" }} width={"35vh"} itemSize={50} itemCount={items.length}>
      {Row}
    </FixedSizeList>
  );
};

export default CheckboxesFixedSizeList;
