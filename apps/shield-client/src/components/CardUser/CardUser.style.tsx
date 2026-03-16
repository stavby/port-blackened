import { Card, Chip, IconButton, styled } from "@mui/material";

export const StyledCardUser = styled(Card)(() => ({
  overflow: "auto",
  marginBottom: "10px",
  "& .MuiCardHeader-root": {
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
}));

export const CardUserHeaderChip = styled(Chip)(() => ({
  borderRadius: "4px",
  borderColor: "#E5E7F9",
  marginRight: "8px",
  color: "#475467",
  fontWeight: "bold",
  fontSize: "14px",
}));

export const CardUserHeaderChipGroups = styled(Chip)(() => ({
  borderRadius: "9999px",
  borderColor: "#E5E7F9",
  marginRight: "8px",
  color: "#475467",
  fontWeight: "bold",
  fontSize: "14px",
}));

export const CardUserHeaderActionIcon = styled(IconButton)(() => ({
  border: "1px solid #D0D5DD",
  borderRadius: "4px",
  gap: "8px",
  marginLeft: "8px",
}));
