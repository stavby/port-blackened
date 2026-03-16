import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { Autocomplete, Box, Checkbox, TextField, Typography, autocompleteClasses } from "@mui/material";
import { PermissionGroup } from "@port/shield-schemas";
import { Domain, FilterUsersInput } from "@types";

const filterDisplayFieldMap = {
  domains: (item: Domain) => item.display_name,
  userTypes: (item: string) => item,
  permissionGroups: (item: PermissionGroup) => item.name,
  specialProperties: (item: string) => item,
  authorizationSource: (item: string) => item,
} as const satisfies Record<keyof FilterUsersInput, (...args: any[]) => any>;

const filterIdFieldMap = {
  domains: (item) => item?._id ?? undefined,
  userTypes: (item) => item ?? undefined,
  permissionGroups: (item) => item?._id ?? undefined,
  specialProperties: (item) => item ?? undefined,
  authorizationSource: (item) => item ?? undefined,
} as const satisfies Record<keyof FilterUsersInput, (...args: any[]) => any>;

type Key = Exclude<keyof FilterUsersInput, "authorizationSource">;
type FilterType<K extends Key> = Required<FilterUsersInput>[K][number];

export interface GenericAutocompleteProps<K extends Key> {
  options: readonly FilterType<K>[];
  localFilters: FilterUsersInput;
  setLocalFilters: (localFilters: FilterUsersInput) => void;
  value: FilterType<K>[];
  filterKey: K;
  title: string;
}

export const GenericAutocomplete = <K extends Key>({
  options,
  localFilters,
  setLocalFilters,
  value,
  filterKey,
  title,
}: GenericAutocompleteProps<K>) => {
  return (
    <Box>
      <Box minHeight="4.5rem" alignItems="center" marginX="10px">
        <Typography minWidth={"10rem"} fontSize="16px" sx={{ color: "#3256DF" }}>
          {title}
        </Typography>
        <Autocomplete
          noOptionsText={"לא נמצא"}
          multiple
          disableCloseOnSelect
          options={options}
          renderInput={(params) => <TextField {...params} />}
          value={value}
          getOptionLabel={(option) => filterDisplayFieldMap[filterKey](option as any)}
          getOptionKey={(option) => filterIdFieldMap[filterKey](option)}
          isOptionEqualToValue={(option, value) => filterIdFieldMap[filterKey](option) == filterIdFieldMap[filterKey](value)}
          onChange={(_event, value) => setLocalFilters({ ...localFilters, [filterKey]: value })}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checkedIcon={<CheckBox />} icon={<CheckBoxOutlineBlank />} style={{ marginRight: 8 }} checked={selected} />
                {filterDisplayFieldMap[filterKey](option as any)}
              </li>
            );
          }}
          slotProps={{
            popper: {
              sx: {
                [`& .${autocompleteClasses.listbox}`]: {
                  direction: "ltr",
                },
              },
            },
          }}
          ListboxProps={{ style: { maxHeight: 350 } }}
        />
      </Box>
    </Box>
  );
};
