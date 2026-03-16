import { Add, Close } from "@mui/icons-material";
import { Box, Button, Grid } from "@mui/material";
import { useMemo } from "react";
import { UsersAutocomplete } from ".";
import { GetUserInfoDto } from "../../types";
import { UserID } from "@port/common-schemas";

type MultiUserSelectorProps = {
  selectedUsers: GetUserInfoDto[];
  onChange: (users: GetUserInfoDto[]) => void;
  disabledRemoveUser?: boolean;
  disabledAddUser?: boolean;
  disabledUsers?: string[];
};

export const MultiUserSelector = ({
  selectedUsers,
  onChange,
  disabledAddUser = false,
  disabledRemoveUser = false,
  disabledUsers = [],
}: MultiUserSelectorProps) => {
  const handleUserSelect = (selectedUser: GetUserInfoDto | null, index: number) => {
    const newUsers = selectedUsers.map((user, currIndex) => (currIndex === index ? (selectedUser ?? { user_id: "" as UserID }) : user));
    onChange(newUsers);
  };

  const isAddUserButtonDisabled = useMemo(
    () => (selectedUsers.length > 0 && selectedUsers.some((user) => user?.user_id === "")) || disabledAddUser,
    [selectedUsers, disabledAddUser],
  );

  return (
    <>
      {selectedUsers.map((user, index) => (
        <Grid container key={`user-${index}`} flexWrap={"nowrap"}>
          <Grid item>
            <Box width="418px">
              <UsersAutocomplete
                value={user}
                disabled={(disabledAddUser || disabledRemoveUser) && disabledUsers?.includes(user.user_id)}
                onUserSelect={(selectedUser) => handleUserSelect(selectedUser, index)}
              />
            </Box>
          </Grid>
          <Grid item>
            <Button
              disabled={disabledRemoveUser && disabledUsers?.includes(user.user_id)}
              onClick={() => {
                onChange(selectedUsers.filter((u) => u.user_id !== user.user_id));
              }}
              sx={{ padding: "20px 0px" }}
            >
              <Close sx={{ width: "16px", height: "16px" }} />
            </Button>
          </Grid>
          <br />
        </Grid>
      ))}
      <Button onClick={() => onChange([...selectedUsers, { user_id: "" as UserID }])} disabled={isAddUserButtonDisabled}>
        <Add sx={{ width: "16px", height: "16px" }} />
        הוסף משתמש
      </Button>
    </>
  );
};
