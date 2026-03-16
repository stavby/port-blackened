import { ArrowDropDown } from "@mui/icons-material";
import { Box } from "@mui/material";

type DropDownCellProps = {
  showDropDownArrow: boolean;
  children?: JSX.Element | string;
};

export const DropDownCell = ({ showDropDownArrow, children }: DropDownCellProps) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" gap={0.5} width="100%">
      <Box>{children}</Box>
      <ArrowDropDown
        sx={{
          color: "#757575",
          display: `${showDropDownArrow ? "flex" : "none"}`,
        }}
      />
    </Box>
  );
};
