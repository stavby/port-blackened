import { Card, CardContent, CardHeader, styled } from "@mui/material";

export const StyledCard = styled(Card)(() => ({
  background: "#e5e7f9",
  borderRadius: "6px",
  boxShadow: "none",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  direction: "rtl",
  marginBottom: "8px",
}));

export const StyledCardHeader = styled(CardHeader)(() => ({
  padding: "8px 16px 0px",
  "& .MuiCardHeader-title": {
    fontSize: "14px",
    fontWeight: "bold",
  },
}));

export const StyledCardContent = styled(CardContent)(() => ({
  padding: "0px 16px 5px !important",
  display: "flex",
  flexDirection: "column",
  overflowY: "scroll",
  direction: "ltr",
  fontWeight: "normal",
  fontSize: "14px",
  width: "95%",

  "&::-webkit-scrollbar": {
    backgroundColor: "transparent",
    width: "10px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#c9cce3",
    border: "none",
    width: "10px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "#c9cce3",
  },
}));
