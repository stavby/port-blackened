import { Add } from "@mui/icons-material";
import { IconButton, IconButtonProps, Typography } from "@mui/material";

type Props = {
  text?: string;
  children?: React.ReactNode;
  iconButtonProps: IconButtonProps;
};

export function DataGridFooterWithAddButton({ iconButtonProps, children, text = "" }: Props) {
  return (
    <div style={{ display: "flex", flexGrow: 1, textAlign: "right", alignItems: "center", justifyContent: "space-between" }}>
      <IconButton {...iconButtonProps}>
        <Add />
        <Typography color="#4d5a6c">{text}</Typography>
      </IconButton>
      {children}
    </div>
  );
}
