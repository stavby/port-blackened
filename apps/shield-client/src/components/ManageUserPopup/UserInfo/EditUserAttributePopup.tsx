import { GeneralForm } from "@components/Popup";
import { AttributeOptions } from "./types";
import {
  Autocomplete,
  Dialog,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { useMemo, useState } from "react";

type Props<T extends string | number | number[]> = {
  open: boolean;
  onClose: () => void;
  defaultAttribute: T;
  title: string;
  attributeOptions: AttributeOptions[];
  disabled?: boolean;
  helperText?: string;
  handleSubmitAtrribue: (selectedAttribute: T) => void;
};

export const EditUserAttributePopup = <T extends string | number | number[]>({
  open,
  onClose,
  defaultAttribute,
  title,
  attributeOptions,
  handleSubmitAtrribue,
  helperText,
  disabled = false,
}: Props<T>) => {
  const [selectedAttribute, setSelectedAttribute] = useState<T>(defaultAttribute);
  const labelsByOptions = useMemo(() => new Map(attributeOptions.map(({ key, label }) => [key, label])), [attributeOptions]);

  const handleSubmitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmitAtrribue(selectedAttribute);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} hideBackdrop={true}>
      <GeneralForm
        style={{ border: 1, borderRadius: 2, borderColor: "#EAECF0" }}
        cancel={() => {
          onClose();
        }}
        onSubmit={handleSubmitForm}
      >
        <FormControl>
          <FormLabel component="legend">{title}</FormLabel>
          {Array.isArray(selectedAttribute) ? (
            <Autocomplete
              id="attribute-autocomplete"
              multiple
              options={attributeOptions.map(({ key }) => key)}
              getOptionLabel={(option) => labelsByOptions.get(option)!} //for each option theres a label see above
              value={selectedAttribute}
              onChange={(_, selectedOptions) => {
                setSelectedAttribute(selectedOptions as T);
              }}
              renderInput={(params) => <TextField {...params} placeholder="יש לבחור אפשרות" style={{ width: "20vw" }} />}
            />
          ) : (
            <RadioGroup
              aria-label="role"
              name="attributeRadio"
              value={selectedAttribute}
              onChange={(_, value) => setSelectedAttribute(value as T)}
              row
            >
              {attributeOptions.map(({ key, label }) => (
                <FormControlLabel key={key} value={key} control={<Radio disabled={disabled} />} label={label} />
              ))}
            </RadioGroup>
          )}
          {helperText && <FormHelperText sx={{ whiteSpace: "wrap", textOverflow: "clip", maxWidth: "50ch" }}>{helperText}</FormHelperText>}
        </FormControl>
      </GeneralForm>
    </Dialog>
  );
};
