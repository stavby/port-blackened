import { useMemo } from "react";
import CheckboxesFixedSizeList, { CheckboxListItem } from "../CheckboxesFixedSizeList";
import { CheckboxState } from "@helpers/useCheckboxState";
import { useRowFilterOptions } from "@helpers/useRowFilterOptions";
import { AddAttributesPopupProps } from "./AddRowFiltersPopup";
import { RowFilterValue, UserRowFilterValue } from "@types";
import { hasNonDirectSources } from "@helpers/permissionSources";

interface RowFilterCheckboxesProps
  extends Pick<AddAttributesPopupProps, "permissionTableId" | "rowFilterKod">,
    CheckboxState<RowFilterValue["value"]> {
  searchTerm: string;
  initialRowFilterValuesMap: Map<RowFilterValue["value"], UserRowFilterValue>;
}

const RowFilterCheckboxes = ({
  searchTerm,
  permissionTableId,
  rowFilterKod,
  checkedValues,
  initialRowFilterValuesMap,
  handleCheckboxChange,
}: RowFilterCheckboxesProps) => {
  const { rowFilterValueOptions } = useRowFilterOptions(permissionTableId, rowFilterKod);

  const filteredOptions = useMemo(() => {
    if (!rowFilterValueOptions) {
      return [];
    }

    return rowFilterValueOptions.reduce<CheckboxListItem<RowFilterValue["value"]>[]>((acc, option) => {
      if (!searchTerm || option.display_name.toLowerCase().includes(searchTerm.toLowerCase())) {
        acc.push({
          value: option.value,
          label: option.display_name,
          disabled: hasNonDirectSources(initialRowFilterValuesMap.get(option.value)?.sources ?? []),
        });
      }
      return acc;
    }, []);
  }, [initialRowFilterValuesMap, rowFilterValueOptions, searchTerm]);

  return <CheckboxesFixedSizeList items={filteredOptions} checkedValues={checkedValues} handleCheckboxChange={handleCheckboxChange} />;
};

export default RowFilterCheckboxes;
