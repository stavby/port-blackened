import { TooltipProps } from "@mui/material";
import { StyledTooltip } from "@port/components/styledTooltip";

const StyledTooltipShield = ({ ...props }: TooltipProps) => <StyledTooltip disableMaxWidth {...props} />;

export default StyledTooltipShield;
