import { GeneralForm } from "@components/Popup";
import { Box, Checkbox, FormControl, FormControlLabel, FormGroup, Popover, Skeleton, Typography } from "@mui/material";
import { FormEvent, useMemo, useState } from "react";
import { SearchField } from "@components/SearchField";
import { ObjectIdBrand, PermissionGroupsDto } from "@port/shield-schemas";
import { MergedClientUser } from "../../../types/users";
import { useMemberEditablePermissionGroups } from "@api/permissionGroups";

type Props = {
  open: boolean;
  onClose: () => void;
  handleSave: (permission_groups_ids: ObjectIdBrand[]) => void;
  permissionGroupsOptions: PermissionGroupsDto[];
  anchorEL: HTMLButtonElement | null;
  user: MergedClientUser;
};

export const AddUserPermissionGroupsPopover = ({ open, onClose, handleSave, permissionGroupsOptions, anchorEL, user }: Props) => {
  const [checkedIds, setCheckedIds] = useState<ObjectIdBrand[]>(user.permission_groups.map((group) => group._id));
  const [searchTerm, setSearchTerm] = useState("");
  const { data: memberEditablePermissionGroups, isLoading } = useMemberEditablePermissionGroups({
    meta: { loading: false },
  });

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

  const filteredPermissionGroups = useMemo(
    () => permissionGroupsOptions.filter((permissionGroup) => permissionGroup.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [permissionGroupsOptions, searchTerm],
  );

  const permissionGroups = useMemo(
    () =>
      filteredPermissionGroups.map((permissionGroup) => ({
        ...permissionGroup,
        disabled: !memberEditablePermissionGroups?.includes(permissionGroup._id),
      })),
    [filteredPermissionGroups, memberEditablePermissionGroups],
  );

  const sortedPermissionGroups = useMemo(
    () => [...permissionGroups].sort((a, b) => Number(a.disabled) - Number(b.disabled)),
    [permissionGroups],
  );

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      anchorEl={anchorEL}
    >
      <GeneralForm onSubmit={handleSubmit} cancel={onClose}>
        <Typography sx={{ paddingBottom: 1, fontWeight: "bold" }}>בחר קבוצות הרשאה</Typography>
        <FormGroup sx={{ width: "80%" }}>
          <SearchField handleSearch={setSearchTerm} />
        </FormGroup>
        <FormControl sx={{ height: "40vh", overflowY: "auto" }}>
          {isLoading ? (
            <Box display="flex" alignItems="center" height="100%" width={280}>
              <Skeleton height="90%" variant="rectangular" width="100%" />
            </Box>
          ) : (
            <FormGroup>
              {sortedPermissionGroups.map(({ _id, name, disabled }) => (
                <FormControlLabel
                  key={_id}
                  value={_id}
                  label={name}
                  control={
                    <Checkbox
                      disabled={disabled}
                      checked={checkedIds.includes(_id)}
                      onChange={(_, checked) => handleCheckboxChange(_id, checked)}
                    />
                  }
                />
              ))}
            </FormGroup>
          )}
        </FormControl>
      </GeneralForm>
    </Popover>
  );
};
