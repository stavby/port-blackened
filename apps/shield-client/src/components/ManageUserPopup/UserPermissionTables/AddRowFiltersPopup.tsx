import { GeneralForm } from "@components/Popup";
import { SearchField } from "@components/SearchField";
import { useCheckboxState } from "@helpers/useCheckboxState";
import { useRowFilterOptions } from "@helpers/useRowFilterOptions";
import { CircularProgress, Dialog, FormControl, FormGroup, FormLabel, Typography } from "@mui/material";
import { RowFilterQueryBuilderType, UserRowFilterValue, UserRowFilterValueDto } from "@types";
import { FormEvent, useMemo, useRef, useState } from "react";
import RowFilterCheckboxes from "./RowFilterCheckboxes";
import RowFilterTree, { RowFilterTreeRef } from "./RowFilterTree";
import { hasDirectSource } from "@helpers/permissionSources";

export type AddAttributesPopupProps = {
  permissionTableId: string;
  rowFilterKod: string;
  queryBuilderType?: RowFilterQueryBuilderType;
  open: boolean;
  initialRowFilterValues: UserRowFilterValue[];
  onClose: () => void;
  handleSave: (rowFilterValues: UserRowFilterValueDto[]) => void;
};

export default function AddRowFilterValuesPopup({
  open,
  onClose,
  handleSave,
  permissionTableId,
  rowFilterKod,
  queryBuilderType,
  initialRowFilterValues,
}: AddAttributesPopupProps) {
  const treeRef = useRef<RowFilterTreeRef>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { checkedValues, handleCheckboxChange } = useCheckboxState(new Set(initialRowFilterValues.map(({ value }) => value)));
  const initialRowFilterValuesMap = useMemo(
    () => new Map(initialRowFilterValues.map((rowFilterValue) => [rowFilterValue.value, rowFilterValue])),
    [initialRowFilterValues],
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { rowFilterValueOptions, isLoading } = useRowFilterOptions(permissionTableId, rowFilterKod, () => {
    setFetchError(`שגיאה בעת טעינת הערכים עבור ${rowFilterKod}`);
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newRowFilterValues =
      rowFilterValueOptions?.reduce<UserRowFilterValueDto[]>((acc, option) => {
        const rowFilterValue = initialRowFilterValuesMap.get(option.value);
        if (checkedValues.has(option.value) && (!rowFilterValue || hasDirectSource(rowFilterValue.sources))) {
          acc.push(option);
        }
        return acc;
      }, []) ?? [];

    handleSave(newRowFilterValues);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} hideBackdrop={true}>
      <GeneralForm
        style={{
          border: 1,
          borderRadius: 2,
          borderColor: "#EAECF0",
        }}
        cancel={onClose}
        onSubmit={handleSubmit}
        disableSave={!!fetchError || checkedValues.size === 0}
      >
        <FormControl sx={{ overflowY: "hidden", minHeight: "55vh", minWidth: "35vh" }}>
          <FormLabel component="legend">בחר הרשאה</FormLabel>
          <FormGroup sx={{ width: "50%" }}>
            <SearchField
              handleSearch={(value) => {
                setSearchTerm(value);
                treeRef.current?.onSearch(value);
              }}
            />
          </FormGroup>
          {fetchError ? (
            <Typography color="red">{fetchError}</Typography>
          ) : isLoading ? (
            <CircularProgress />
          ) : (
            <FormGroup>
              {queryBuilderType === "tree" ? (
                <RowFilterTree
                  checkedValues={checkedValues}
                  initialRowFilterValuesMap={initialRowFilterValuesMap}
                  handleCheckboxChange={handleCheckboxChange}
                  permissionTableId={permissionTableId}
                  rowFilterKod={rowFilterKod}
                  ref={treeRef}
                />
              ) : (
                <RowFilterCheckboxes
                  checkedValues={checkedValues}
                  initialRowFilterValuesMap={initialRowFilterValuesMap}
                  handleCheckboxChange={handleCheckboxChange}
                  permissionTableId={permissionTableId}
                  rowFilterKod={rowFilterKod}
                  searchTerm={searchTerm}
                />
              )}
            </FormGroup>
          )}
        </FormControl>
      </GeneralForm>
    </Dialog>
  );
}
