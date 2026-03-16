import { Domain } from "@types";
import { GeneralForm } from "@components/Popup";
import { Checkbox, FormControl, FormControlLabel, FormGroup, Popover, Typography } from "@mui/material";
import { FormEvent, useMemo, useState } from "react";
import { SearchField } from "@components/SearchField";
import { ObjectIdBrand } from "@port/shield-schemas";

type Props = {
  open: boolean;
  onClose: () => void;
  handleSave: (domainIds: ObjectIdBrand[]) => void;
  domainsOptions: Domain[];
  disabledDomainsIds: string[];
  anchorEL: HTMLButtonElement | null;
};

export const AddUserDomainPopover = ({ open, onClose, handleSave, domainsOptions, disabledDomainsIds, anchorEL }: Props) => {
  const [checkedIds, setCheckedIds] = useState<ObjectIdBrand[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSave(checkedIds);
    onClose();
  };

  const handleCheckboxChange = (id: ObjectIdBrand, checked: boolean) => {
    setCheckedIds((prevState) => {
      if (checked) return [...prevState, id];
      else return prevState.filter((currId) => id !== currId);
    });
  };

  const filteredDomains = useMemo(
    () => domainsOptions.filter((domain) => domain.display_name.toLowerCase().includes(searchTerm.toLowerCase())),
    [domainsOptions, searchTerm],
  );

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      anchorEl={anchorEL}
    >
      <GeneralForm onSubmit={handleSubmit} cancel={onClose} disableSave={!checkedIds.length}>
        <Typography sx={{ paddingBottom: 1, fontWeight: "bold" }}>בחר עולמות תוכן</Typography>
        <FormGroup sx={{ width: "80%" }}>
          <SearchField handleSearch={setSearchTerm} />
        </FormGroup>
        <FormControl sx={{ height: "40vh", overflowY: "auto" }}>
          <FormGroup>
            {filteredDomains.map(({ _id, display_name }) => (
              <FormControlLabel
                key={_id}
                value={_id}
                label={display_name}
                control={
                  <Checkbox
                    checked={checkedIds.includes(_id)}
                    onChange={(_, checked) => handleCheckboxChange(_id, checked)}
                    disabled={disabledDomainsIds.includes(_id)}
                  />
                }
              />
            ))}
          </FormGroup>
        </FormControl>
      </GeneralForm>
    </Popover>
  );
};
