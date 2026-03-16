import { Popover, PopoverOrigin } from "@mui/material";
import { ReactNode } from "react";

export const GeneralPopover = ({
  anchorEl,
  handlePopoverClose,
  children,
  horizontal,
  open,
}: {
  anchorEl: HTMLElement | null;
  handlePopoverClose: () => void;
  children: ReactNode;
  horizontal?: PopoverOrigin["horizontal"];
  open?: boolean;
}) => {
  return (
    <Popover
      open={open ?? Boolean(anchorEl)}
      sx={{ pointerEvents: "none" }}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: "bottom", horizontal: horizontal ?? "right" }}
      transformOrigin={{ vertical: "top", horizontal: horizontal ?? "right" }}
      onClose={handlePopoverClose}
      disableRestoreFocus
    >
      {children}
    </Popover>
  );
};
