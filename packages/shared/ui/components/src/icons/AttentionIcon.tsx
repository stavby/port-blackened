import { Typography } from "@mui/material";
import { StyledTooltip } from "../StyledTooltip";
import { ReactElement } from "react";

interface AttentionIconProps {
  tooltipTitle: React.ReactNode;
  icon: ReactElement;
}

const AttentionIcon = ({ tooltipTitle, icon }: AttentionIconProps) => {
  const title = (
    <Typography padding={1} textAlign="center" variant="body2">
      {tooltipTitle}
    </Typography>
  );

  return <StyledTooltip title={title}>{icon}</StyledTooltip>;
};

export default AttentionIcon;
