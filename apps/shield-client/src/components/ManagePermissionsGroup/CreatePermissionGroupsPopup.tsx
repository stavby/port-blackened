import { FormControl, SelectChangeEvent, TextField } from "@mui/material";
import { Key } from "@phosphor-icons/react";
import { ChangeEvent, Dispatch, useState } from "react";
import { GeneralForm, GeneralPopup } from "../";
import { INITIAL_EMPTY_PERMISSION_GROUP } from "../../types/permission_groups";
import { CreatePermissionGroupDto } from "@port/shield-schemas";

type CreatePermissionGroupsPopupProps = {
  openModal: boolean;
  setOpenModal: Dispatch<React.SetStateAction<boolean>>;
  title: string;
  cancel: () => void;
  onSubmit: (permisionGroup: CreatePermissionGroupDto) => unknown;
};

const MIN_LENGTH_ERROR_TEXT = "האורך המינימלי הוא 3 תווים";

export const CreatePermissionGroupsPopup = ({ openModal, setOpenModal, title, cancel, onSubmit }: CreatePermissionGroupsPopupProps) => {
  const isMinLengthError = (value: string | undefined) => (value ? value.length < 3 : false);
  const [formPermissionGroup, setFormPermissionGroup] = useState(INITIAL_EMPTY_PERMISSION_GROUP);

  const onFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string[]>) => {
    const { name, value } = event.target;

    setFormPermissionGroup({
      ...formPermissionGroup,
      [name]: value,
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formPermissionGroup);
  };

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
      <GeneralForm cancel={cancel} onSubmit={handleSubmit}>
        <FormControl sx={{ mb: 2, mt: 2, width: "26vw" }}>
          <TextField
            label="שם קבוצת הרשאה"
            name="name"
            value={formPermissionGroup.name}
            onChange={onFormChange}
            required
            error={isMinLengthError(formPermissionGroup?.name)}
            helperText={isMinLengthError(formPermissionGroup?.name) ? MIN_LENGTH_ERROR_TEXT : ""}
            autoComplete="off"
          />
        </FormControl>
        <FormControl sx={{ mb: 2, mt: 2, width: "26vw" }}>
          <TextField name="description" label="תיאור" multiline value={formPermissionGroup.description} rows={4} onChange={onFormChange} />
        </FormControl>
      </GeneralForm>
    </GeneralPopup>
  );
};
