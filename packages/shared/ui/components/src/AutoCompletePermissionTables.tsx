"use client";

import { Autocomplete, AutocompleteProps, SxProps, TextField } from "@mui/material";
import type { PermissionTable } from "@port/shield-schemas";
import React, { useMemo } from "react";

export interface AutocompletePermissionTablesProps {
  isDisabled: boolean;
  permissionTables: PermissionTable[];
  name: string;
  value: string | null | undefined;
  onChange: AutocompleteProps<PermissionTable | null, false, false, false>["onChange"];
  error: boolean;
  sx?: SxProps;
}

export const EMPTY_VALUE_ID = "123456789";

const emptyValue: PermissionTable = {
  _id: EMPTY_VALUE_ID,
  name: "empty value",
  display_name: "ללא טבלת הרשאה",
  row_filters: [],
  permission_keys: [],
};

const AutocompletePermissionTables: React.FC<AutocompletePermissionTablesProps> = ({
  isDisabled,
  permissionTables,
  value,
  onChange,
  error,
  sx,
}) => {
  const selectedOption = useMemo(() => {
    if (value === EMPTY_VALUE_ID) {
      return emptyValue;
    }

    return permissionTables.find((table) => table._id === value) ?? null;
  }, [permissionTables, value]);

  return (
    <Autocomplete<PermissionTable | null, false, false, false>
      id="permissions-table"
      size="small"
      options={[...permissionTables, emptyValue]}
      getOptionLabel={(option) => option?.display_name || ""}
      value={selectedOption}
      onChange={onChange}
      isOptionEqualToValue={(option, value) => option?._id === value?._id}
      disabled={isDisabled}
      renderInput={(params) => <TextField error={error} {...params} />}
      sx={{
        width: "75%",
        borderRadius: "8px",
        boxShadow: "none",
        border: "none",
        ...sx,
      }}
    />
  );
};

export default AutocompletePermissionTables;
