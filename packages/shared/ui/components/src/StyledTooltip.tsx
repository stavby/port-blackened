"use client";

import { Tooltip, TooltipProps, styled, tooltipClasses } from "@mui/material";
import { ForwardedRef, forwardRef } from "react";

const ToolTipComponent = forwardRef(
  (
    { className, disableMaxWidth: _disableMaxWidth, ...props }: TooltipProps & { disableMaxWidth?: boolean },
    ref: ForwardedRef<unknown>,
  ) => <Tooltip ref={ref} placement="top" arrow classes={{ popper: className }} {...props} />,
);
ToolTipComponent.displayName = "ToolTipComponent";

const StyledTooltip = styled(ToolTipComponent)((props) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#3D3F6D",
    width: !props.disableMaxWidth ? 180 : undefined,
    maxWidth: props.disableMaxWidth ? "none" : undefined,
    fontSize: 14,
    borderRadius: 5,
    textAlign: "center",
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#3D3F6D",
  },
}));

export { StyledTooltip };
