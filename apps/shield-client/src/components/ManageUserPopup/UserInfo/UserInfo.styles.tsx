import { Card, Stack, styled } from "@mui/material";

export const UserInfoCard = styled(Card)(({ theme }) => ({
  backgroundColor: "#f2f3fc",
  color: theme.palette.text.primary,
  borderRadius: "15px",
  height: "100%",
}));

export const StackStyled = styled(Stack)(({ theme }) => ({
  "& .userIcon": {
    color: theme.palette.primary.main,
  },
}));
