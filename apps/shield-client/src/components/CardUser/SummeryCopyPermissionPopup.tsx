import { checkUsersExistence } from "@api/users";
import { Box, Button, Chip, Grid, Typography } from "@mui/material";
import { Check, Checks } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { UserDomainDto, UserDto } from "@types";
import { Dispatch, useMemo } from "react";
import { CopyToUserType, GeneralPopup } from "..";

type CopyToUsersListProps = {
  title: string;
  copyToUsers: CopyToUserType[];
  type?: "valid" | "invalid";
};

const CopyToUsersList = ({ title, copyToUsers, type = "valid" }: CopyToUsersListProps) => {
  return (
    copyToUsers.length > 0 && (
      <Grid container columnSpacing={1} alignItems="center">
        <Grid item>
          <Typography>{title}</Typography>
        </Grid>
        <Grid item xs={8} container rowSpacing={1} justifyContent="flex-start" alignItems="center">
          {copyToUsers.map(({ user_id }) => (
            <Grid item xs={3} key={user_id}>
              <Chip label={user_id} sx={{ width: "95%", ...(type === "invalid" ? { background: "#f7bec3" } : {}) }} />
            </Grid>
          ))}
        </Grid>
      </Grid>
    )
  );
};

type SummeryCopyPermissionPopupProps = {
  open: boolean;
  setOpen: Dispatch<React.SetStateAction<boolean>>;
  copyToUsers: CopyToUserType[];
  copyFromUser: UserDto;
  allowedDomains: UserDomainDto[];
  handleConfirmCopy: (validDestinationUsers: CopyToUserType[]) => void;
};

export const SummeryCopyPermissionPopup = ({
  open,
  setOpen,
  copyToUsers,
  copyFromUser,
  allowedDomains,
  handleConfirmCopy,
}: SummeryCopyPermissionPopupProps) => {
  const copyToUsersIds = useMemo(() => copyToUsers.map(({ user_id }) => user_id), [copyToUsers]);

  const checkUsersExistenceQuery = useQuery({
    queryKey: ["users", "existence", copyToUsersIds],
    queryFn: () => checkUsersExistence(copyToUsersIds),
    meta: {
      loading: false,
    },
  });

  const destinationUsers = useMemo(() => {
    if (!checkUsersExistenceQuery.data) return { valid: [], invalid: [] };

    return copyToUsers.reduce<{ valid: CopyToUserType[]; invalid: CopyToUserType[] }>(
      (acc, copyToUser) => {
        if (checkUsersExistenceQuery.data[copyToUser.user_id]) {
          acc.invalid.push(copyToUser);
        } else {
          acc.valid.push(copyToUser);
        }

        return acc;
      },
      { valid: [], invalid: [] },
    );
  }, [copyToUsers, checkUsersExistenceQuery.data]);

  const allowedDomainsDisplay = useMemo(() => allowedDomains.map(({ display_name }) => display_name).join(", "), [allowedDomains]);

  return (
    <GeneralPopup
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      title={`סיכום העתקת הרשאה מ-${copyFromUser.user_id}`}
      titleIcon={
        <Checks
          color="#fff"
          fontSize={25}
          style={{
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
            backgroundColor: "#19B4A7",
          }}
        />
      }
      fullWidth
    >
      <Box sx={{ mb: 3, mt: 1, display: "flex", flexDirection: "column", rowGap: 1 }}>
        <Typography>
          <span style={{ fontWeight: "bold" }}>שים לב!</span> רק עולמות התוכן שבאחריותך יועתקו למשתמשים שבחרת
        </Typography>
        <Typography>
          <span style={{ fontWeight: "bold" }}>עולמות התוכן שיועתקו למשתמשים:</span> {allowedDomainsDisplay}
        </Typography>
      </Box>
      <Box sx={{ mb: 1 }}>
        <CopyToUsersList title="משתמשים שיעודכנו:" copyToUsers={destinationUsers.valid} />
        <Box mt={2}>
          <CopyToUsersList title="משתמשים שלא יעודכנו:" copyToUsers={destinationUsers.invalid} type="invalid" />
          <Typography>לא ניתן להעתיק הרשאות למשתמשים שכבר קיימים במערכת</Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={() => setOpen(false)} variant="outlined" sx={{ margin: 0.5 }}>
          ביטול
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={() => handleConfirmCopy(destinationUsers.valid)}
          sx={{ margin: 0.5 }}
          endIcon={<Check />}
          disabled={destinationUsers.valid.length === 0}
        >
          בצע העתקה
        </Button>
      </Box>
    </GeneralPopup>
  );
};
