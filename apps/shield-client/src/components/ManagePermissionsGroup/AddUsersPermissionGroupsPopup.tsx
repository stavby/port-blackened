import { GeneralPopup } from "@components/Popup";
import { Box, Button } from "@mui/material";
import { Copy } from "@phosphor-icons/react";
import { GetUserInfoDto } from "@types";
import { Dispatch, useMemo } from "react";
import { MultiUserSelector } from "..";
import { PermissionGroupsDto } from "@port/shield-schemas";

type AddUsersPermissionGroupsPopupProps = {
  openModalAddUsers: boolean;
  onClose: () => void;
  permissionGroup: PermissionGroupsDto;
  addedUsers: GetUserInfoDto[];
  setAddedUsers: Dispatch<React.SetStateAction<GetUserInfoDto[]>>;
  handleConfirmAddedUsers: () => void;
};

export const AddUsersPermissionGroupsPopup = ({
  openModalAddUsers,
  onClose,
  addedUsers,
  permissionGroup,
  setAddedUsers,
  handleConfirmAddedUsers,
}: AddUsersPermissionGroupsPopupProps) => {
  const isContinueButtonDisabled = useMemo(() => addedUsers.length === 0 || addedUsers.some((user) => user.user_id === ""), [addedUsers]);

  return (
    <GeneralPopup
      open={openModalAddUsers}
      onClose={onClose}
      title={`הוספת משתמשים לקבוצת הרשאה - ${permissionGroup.name}`}
      titleIcon={
        <Copy
          color="#fff"
          fontSize={25}
          style={{
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
            backgroundColor: "#3256DF",
          }}
        />
      }
      fullWidth
    >
      <Box sx={{ padding: 2, margin: 1 }}>
        <div style={{ border: "1px solid #EAECF0", padding: "10px" }}>
          <MultiUserSelector selectedUsers={addedUsers} onChange={setAddedUsers} />
        </div>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={onClose} variant="outlined" sx={{ margin: 0.5 }}>
          ביטול
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleConfirmAddedUsers}
          sx={{ margin: 0.5 }}
          disabled={isContinueButtonDisabled}
        >
          המשך
        </Button>
      </Box>
    </GeneralPopup>
  );
};
