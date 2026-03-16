import StyledTooltipShield from "@components/Tooltip";
import { Chip, TooltipProps, styled, tooltipClasses } from "@mui/material";

export const StyledChip = styled(Chip)(() => ({
  fontWeight: "bold",
  fontSize: "14px",
  borderRadius: "4px",
  pr: 0.5,
  textAlign: "center",
}));

export const StyledUsernameTooltip = styled(({ className, ...props }: TooltipProps) => (
  <StyledTooltipShield
    placement="top"
    slotProps={{
      popper: {
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, -10],
            },
          },
        ],
      },
    }}
    {...props}
  />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    fontSize: 12,
  },
}));
