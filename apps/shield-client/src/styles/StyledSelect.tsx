import { Select, styled } from "@mui/material";

const StyledSelect = styled(Select)(() => ({
  borderRadius: "8px",
  boxShadow: "none",
  "& .MuiSelect-select.Mui-disabled": {
    backgroundColor: "#EDEDF4",
    WebkitTextFillColor: "#75769A",
    color: "#75769A",
    borderRadius: "8px",
  },
  "&.MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
}));

export default StyledSelect;
