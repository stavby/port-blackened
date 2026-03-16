import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { Key } from "@phosphor-icons/react";
import { Domain } from "@types";
import { ChangeEvent, Dispatch } from "react";
import { GeneralForm, GeneralPopup } from ".";

type GeneralPermissionPopupProps = {
  openModal: boolean;
  setOpenModal: Dispatch<React.SetStateAction<boolean>>;
  title: string;
  cancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string[]>) => void;
  nameValue: string;
  descriptionValue: string | undefined;
  relatedDomains: {
    value: string[] | undefined;
    items: Domain[];
    disabled?: boolean;
  };
};

const MIN_LENGTH_ERROR_TEXT = "האורך המינימלי הוא 3 תווים";

export const GeneralPermissionPopup = ({
  openModal,
  setOpenModal,
  title,
  cancel,
  onSubmit,
  onChange,
  nameValue,
  descriptionValue,
  relatedDomains,
}: GeneralPermissionPopupProps) => {
  const isMinLengthError = (value: string | undefined) => (value ? value.length < 3 : false);

  return (
    <GeneralPopup
      open={openModal}
      onClose={() => {
        setOpenModal(false);
      }}
      title={title}
      titleIcon={
        <Key
          color="#fff"
          fontSize={25}
          style={{
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
            backgroundColor: "#FC5367",
          }}
        />
      }
    >
      <GeneralForm cancel={cancel} onSubmit={onSubmit}>
        {/* name */}
        <FormControl sx={{ mb: 2, mt: 2, width: "26vw" }}>
          <TextField
            label="שם רמת הרשאה"
            name="name"
            value={nameValue}
            onChange={onChange}
            required
            error={isMinLengthError(nameValue)}
            helperText={isMinLengthError(nameValue) ? MIN_LENGTH_ERROR_TEXT : ""}
          />
        </FormControl>
        {/* description */}
        <FormControl sx={{ mb: 2, mt: 2, width: "26vw" }}>
          <TextField
            name="description"
            label="תיאור"
            multiline
            value={descriptionValue}
            rows={4}
            onChange={onChange}
            required
            error={isMinLengthError(descriptionValue)}
            helperText={isMinLengthError(descriptionValue) ? MIN_LENGTH_ERROR_TEXT : ""}
          />
        </FormControl>
        {/* related domains */}
        <FormControl sx={{ width: "26vw" }}>
          <InputLabel id="related-domain-select-label">עולמות תוכן מקושרים</InputLabel>
          <Select
            labelId="related-domain-select-label"
            name="related_domains"
            label="עולמות תוכן מקושרים"
            placeholder="עולמות תוכן מקושרים"
            multiple
            value={relatedDomains.value}
            renderValue={(selectedValues) =>
              selectedValues.map((value) => relatedDomains.items.find((domain) => domain._id === value)?.display_name).join(", ")
            }
            input={<OutlinedInput label="עולמות תוכן מקושרים" />}
            disabled={relatedDomains?.disabled ?? false}
            onChange={onChange}
            MenuProps={{
              PaperProps: {
                style: {
                  direction: "rtl",
                  maxHeight: 224,
                },
              },
            }}
          >
            {relatedDomains.items.map(({ _id, display_name }) => (
              <MenuItem key={_id} value={_id}>
                <Checkbox checked={relatedDomains.value ? relatedDomains.value?.findIndex((item) => item === _id) > -1 : false} />
                <ListItemText primary={display_name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </GeneralForm>
    </GeneralPopup>
  );
};
