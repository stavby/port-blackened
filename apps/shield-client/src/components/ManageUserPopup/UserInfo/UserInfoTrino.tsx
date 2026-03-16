import { useUserFullInfo } from "@api/userInfo";
import { Box, Skeleton, Typography } from "@mui/material";

type UserInfoPropertyWithSkeletonProps = {
  userProperty: { title: string; value: string | number | undefined };
  isLoading: boolean;
};

const UserInfoPropertyWithSkeleton = ({ isLoading, userProperty }: UserInfoPropertyWithSkeletonProps) => {
  return (
    <Box height="3em">
      {isLoading ? (
        <Skeleton animation="wave" width="100%" height="100%" />
      ) : (
        <>
          <Typography fontSize={16} variant="subtitle2" sx={{ fontWeight: "bold" }}>
            {userProperty.title}
          </Typography>
          <Typography fontSize={14}>{userProperty.value || "לא קיים במערכת"}</Typography>
        </>
      )}
    </Box>
  );
};

type UserInfoTrinoProps = { user_id: string };

export const UserInfoTrino = ({ user_id }: UserInfoTrinoProps) => {
  const { data: userInfo, isLoading } = useUserFullInfo(user_id);

  return (
    <Box>
      <Typography sx={{ fontWeight: "bold", paddingTop: 2, paddingBottom: 1 }}>{"פרטי משתמש"}</Typography>
      <Box display="flex" flexDirection="column" rowGap={1}>
        <UserInfoPropertyWithSkeleton userProperty={{ value: userInfo?.shem_yechida, title: "יחידה" }} isLoading={isLoading} />
        <UserInfoPropertyWithSkeleton userProperty={{ value: userInfo?.sabat, title: 'סב"ט' }} isLoading={isLoading} />
        <UserInfoPropertyWithSkeleton userProperty={{ value: userInfo?.shem_darga, title: "דרגה" }} isLoading={isLoading} />
        <UserInfoPropertyWithSkeleton userProperty={{ value: userInfo?.shem_sug_sherut, title: "סוג שירות" }} isLoading={isLoading} />
        <UserInfoPropertyWithSkeleton userProperty={{ value: userInfo?.cell_phone, title: "טלפון" }} isLoading={isLoading} />
      </Box>
    </Box>
  );
};
