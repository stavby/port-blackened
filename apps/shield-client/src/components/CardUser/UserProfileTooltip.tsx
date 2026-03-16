import { useUserFullInfo } from "@api/userInfo";
import StyledTooltip from "@components/Tooltip";
import { Box, Skeleton } from "@mui/material";
import { FullUserInfo } from "@types";
import { ReactElement, useState } from "react";
import { StyledCard, StyledCardContent, StyledCardHeader } from "../../styles/CardStyle";
import { formatDate } from "@port/utils";

interface CardWithSkeletonProps {
  isLoading: boolean;
  userProperty: { title: string; value: string | number | undefined };
}

const CardWithSkeleton = ({ isLoading, userProperty }: CardWithSkeletonProps) => {
  return (
    <StyledCard sx={{ width: "288px", height: "55px" }}>
      {isLoading ? (
        <Box height="100%" width="100%" display="flex" justifyContent="center">
          <Skeleton animation="wave" width="90%" height="100%" />
        </Box>
      ) : (
        <>
          <StyledCardHeader
            title={userProperty.title}
            sx={{
              overflow: "hidden",
            }}
          />
          <StyledCardContent>{userProperty.value || "לא קיים במערכת"}</StyledCardContent>
        </>
      )}
    </StyledCard>
  );
};

interface UserProfileTooltipTitle {
  isLoading: boolean;
  userInfo: FullUserInfo | undefined;
}

const UserProfileTooltipTitle = ({ userInfo, isLoading }: UserProfileTooltipTitle) => {
  return (
    <Box sx={{ py: 0.5 }}>
      <CardWithSkeleton isLoading={isLoading} userProperty={{ title: "יחידה", value: userInfo?.shem_yechida }} />
      <CardWithSkeleton isLoading={isLoading} userProperty={{ title: 'סב"ט', value: userInfo?.sabat }} />
      <CardWithSkeleton isLoading={isLoading} userProperty={{ title: "דרגה", value: userInfo?.shem_darga }} />
      <CardWithSkeleton isLoading={isLoading} userProperty={{ title: "סוג שירות", value: userInfo?.shem_sug_sherut }} />
      <CardWithSkeleton isLoading={isLoading} userProperty={{ title: "עיסוק", value: userInfo?.shem_isuk }} />
      <CardWithSkeleton isLoading={isLoading} userProperty={{ title: "תאריך תום שירות", value: formatDate(userInfo?.tatash_date) }} />
      <CardWithSkeleton isLoading={isLoading} userProperty={{ title: "טלפון", value: userInfo?.cell_phone }} />
    </Box>
  );
};

interface UserProfileTooltipProps {
  user_id: string;
  children: ReactElement;
  disabled?: boolean;
}

export const UserProfileTooltip = ({ user_id, children, disabled = false }: UserProfileTooltipProps) => {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useUserFullInfo(user_id, { enabled: open });

  return (
    <StyledTooltip
      open={!disabled && open}
      title={<UserProfileTooltipTitle userInfo={data} isLoading={isLoading} />}
      onOpen={() => {
        if (!disabled) {
          setOpen(true);
        }
      }}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [5, -15],
              },
            },
          ],
        },
      }}
    >
      {children}
    </StyledTooltip>
  );
};
