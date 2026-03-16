import { InputAdornment, TextField } from "@mui/material";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { debounce } from "lodash";
import { useEffect, useMemo, useState } from "react";

type SearchFieldProps = {
  handleSearch: (newSearchTerm: string) => void;
  overrideSearchTerm?: string;
};

export const SearchField = ({ overrideSearchTerm = "", handleSearch }: SearchFieldProps) => {
  const [searchTerm, setSearchTerm] = useState<string>(overrideSearchTerm);

  const debouncedSearch = useMemo(() => debounce(handleSearch, 300), [handleSearch]);

  const handleChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchTerm(overrideSearchTerm);
  }, [overrideSearchTerm]);

  return (
    <TextField
      variant="standard"
      placeholder="חיפוש"
      value={searchTerm}
      onChange={(event) => handleChange(event.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <MagnifyingGlass color="#3256DF" weight="bold" />
          </InputAdornment>
        ),
      }}
    />
  );
};
