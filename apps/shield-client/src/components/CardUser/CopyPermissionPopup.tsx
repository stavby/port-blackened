import { GeneralPopup } from "@components/Popup";
import { Box, Button, Grid } from "@mui/material";
import { Copy, UserCircle } from "@phosphor-icons/react";
import { UserDto } from "@types";
import { Dispatch, useMemo } from "react";
import { MultiUserSelector } from "./MultiUserSelector";
import { CopyToUserType } from "./CardUser";
import { toFullName } from "@helpers/toFullName";

type CopyPermissionPopupProps = {
  openCopy: boolean;
  onClose: () => void;
  copyToUsers: CopyToUserType[];
  setCopyToUsers: Dispatch<React.SetStateAction<CopyToUserType[]>>;
  user: UserDto;
  handleConfirmCopy: () => void;
};

export const CopyPermissionPopup = ({
  openCopy,
  onClose,
  copyToUsers,
  setCopyToUsers,
  user,
  handleConfirmCopy,
}: CopyPermissionPopupProps) => {
  const isContinueButtonDisabled = useMemo(
    () => copyToUsers.length === 0 || copyToUsers.some((user) => user.user_id === ""),
    [copyToUsers],
  );

  return (
    <GeneralPopup
      open={openCopy}
      onClose={onClose}
      title="העתקת הרשאה"
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
        <span style={{ color: "#3256DF" }}>העתקה מתבצעת מ-</span>
        <Grid container alignItems="center" columnGap={1} sx={{ border: "1px solid #EAECF0", padding: "10px" }}>
          <Grid item display="flex" alignItems="center">
            <UserCircle size={34} color={"#3256DF"} weight="duotone" />
          </Grid>
          <Grid item>
            <span style={{ fontWeight: "bold" }}>{user.user_id}</span>
          </Grid>
          <Grid item>
            <span>{toFullName(user)}</span>
          </Grid>
        </Grid>
        <br />
        <span style={{ color: "#3256DF" }}>אל</span>
        <div style={{ border: "1px solid #EAECF0", padding: "10px" }}>
          <MultiUserSelector selectedUsers={copyToUsers} onChange={setCopyToUsers} />
        </div>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={onClose} variant="outlined" sx={{ margin: 0.5 }}>
          ביטול
        </Button>
        <Button type="submit" variant="contained" onClick={handleConfirmCopy} sx={{ margin: 0.5 }} disabled={isContinueButtonDisabled}>
          המשך
        </Button>
      </Box>
    </GeneralPopup>
  );
};
