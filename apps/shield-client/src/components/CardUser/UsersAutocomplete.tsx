import { searchUsers } from "@api/userInfo";
import { Autocomplete, autocompleteClasses, CircularProgress, InputAdornment, TextField } from "@mui/material";
import { UserCircle } from "@phosphor-icons/react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { GetUserInfoDto } from "@types";
import { useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

const DEBOUNCE_WAIT_MS = 300;
const MIN_SEARCH_LENGTH = 3;

interface UsersAutocompleteProps {
  value?: GetUserInfoDto | null;
  onUserSelect: (newSelectedUser: GetUserInfoDto | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string | null;
}

const formatUserOptionLabel = ({ first_name, last_name, user_id }: GetUserInfoDto) =>
  first_name && last_name ? `${first_name} ${last_name} - ${user_id}` : user_id;

export const UsersAutocomplete = ({ value, onUserSelect, disabled = false, error = false, helperText }: UsersAutocompleteProps) => {
  const [search, setSearch] = useState("");
  const [isAutoCompleteOpen, setIsAutoCompleteOpen] = useState(false);
  const debounceSearch = useDebounceCallback((newSearchValue: string) => setSearch(newSearchValue), DEBOUNCE_WAIT_MS);

  const searchUsersQuery = useQuery({
    queryKey: ["user-info", "search", search],
    queryFn: async () => searchUsers(search),
    placeholderData: search.length > MIN_SEARCH_LENGTH ? keepPreviousData : [],
    enabled: search.length > MIN_SEARCH_LENGTH && isAutoCompleteOpen && (!value?.user_id || !search.includes(value?.user_id)),
    meta: {
      loading: false,
    },
  });

  return (
    <Autocomplete
      disabled={disabled}
      value={value}
      open={isAutoCompleteOpen}
      onOpen={() => setIsAutoCompleteOpen(true)}
      onClose={() => setIsAutoCompleteOpen(false)}
      options={searchUsersQuery.data ?? []}
      onChange={(_, newSelectedUser) => {
        onUserSelect(newSelectedUser);
      }}
      getOptionLabel={formatUserOptionLabel}
      filterOptions={(option) => option}
      isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
      onInputChange={(_, newSearchValue) => debounceSearch(newSearchValue)}
      fullWidth
      noOptionsText="אין תוצאות"
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          name="search"
          size="small"
          fullWidth
          placeholder="חיפוש..."
          error={!!searchUsersQuery.error || error}
          helperText={(searchUsersQuery.error ? "הייתה שגיאה בהשגת המשתמשים" : null) ?? helperText}
          sx={{
            borderRadius: "4px",
            bgcolor: "white",
            justifyItems: "center",
            "& .MuiFilledInput-underline::before": {
              borderBottom: 0,
            },
            "& .MuiFilledInput-root": {
              p: "0.5rem",
            },
            "& fieldset": { border: "none" },
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="end">
                <UserCircle size={30} color="#3255DF" weight="duotone" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {(searchUsersQuery.isLoading || searchUsersQuery.isFetching) && <CircularProgress size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
            sx: {
              borderRadius: "4px",
            },
          }}
        />
      )}
      slotProps={{
        paper: {
          sx: {
            textAlign: "left",
          },
        },
        popper: {
          sx: {
            [`& .${autocompleteClasses.listbox}`]: {
              direction: "ltr",
            },
          },
        },
      }}
    />
  );
};
