"use client";

import { Autocomplete, AutocompleteProps, SxProps, TextField } from "@mui/material";
import React, { useMemo } from "react";

type GetDomainDto = {
  domain_id: string;
  name: string;
  display_name: string;
  can_update: boolean;
};

export interface AutocompleteDomainsProps {
  isDisabled: boolean;
  domains: GetDomainDto[];
  name: string;
  value: string | null | undefined;
  onChange: AutocompleteProps<GetDomainDto | null, false, false, false>["onChange"];
  error: boolean;
  sx?: SxProps;
}

const AutocompleteDomains: React.FC<AutocompleteDomainsProps> = ({ isDisabled, domains, value, onChange, error, sx }) => {
  const selectedOption = useMemo(() => domains.find((domain) => domain.domain_id === value) ?? null, [domains, value]);

  return (
    <Autocomplete<GetDomainDto | null, false, false, false>
      id="domain"
      size="small"
      options={domains}
      getOptionLabel={(option) => option?.display_name || ""}
      value={selectedOption}
      onChange={onChange}
      isOptionEqualToValue={(option, value) => option?.domain_id === value?.domain_id}
      disabled={isDisabled || selectedOption?.can_update == false}
      getOptionDisabled={(option) => !option?.can_update}
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

export default AutocompleteDomains;
