import { getUserInfoByUserId } from "@api/userInfo";
import { StyledUsernameTooltip } from "@components/TaskCard";
import { toFullName } from "@helpers/toFullName";
import { Box, Skeleton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { GetUserInfoDto } from "@types";
import { ReactElement, ReactNode, useState } from "react";

interface UserFullNameTooltipProps {
  user_id: string | undefined;
  children: ReactElement;
}

const getTooltipTitle = (data: GetUserInfoDto | undefined, isLoading: boolean, isError: boolean): ReactNode => {
  if (isLoading) {
    return (
      <Box width="5em">
        <Skeleton animation="wave" sx={{ bgcolor: "gray" }} />
      </Box>
    );
  }

  if (isError) {
    return "שם המשתמש לא נמצא";
  }

  return data ? toFullName(data) : null;
};

const UserFullNameTooltip = ({ user_id, children }: UserFullNameTooltipProps) => {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-info", user_id],
    queryFn: async () => {
      if (user_id) {
        return await getUserInfoByUserId(user_id);
      }
    },
    enabled: open,
    meta: {
      loading: false,
    },
  });

  const title = getTooltipTitle(data, isLoading, isError);

  return (
    <StyledUsernameTooltip open={open} title={title} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}>
      {children}
    </StyledUsernameTooltip>
  );
};

export default UserFullNameTooltip;
