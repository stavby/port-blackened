import StyledTooltipShield from "@components/Tooltip";
import { mergeSx } from "@helpers/mergeSx";
import { Tooltip, TooltipProps, Typography, TypographyProps, useTheme } from "@mui/material";
import { MouseEventHandler, ReactNode, useCallback, useRef, useState } from "react";

interface OverflowTooltipProps {
  title: ReactNode;
  label: ReactNode;
  labelProps?: TypographyProps;
  tooltipProps?: Omit<TooltipProps, "title" | "children">;
}

const labelContainerSx = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

const OverflowTooltip = ({ title, label, labelProps, tooltipProps }: OverflowTooltipProps) => {
  const textRef = useRef<HTMLDivElement | null>(null);
  const [isOverflown, setIsOverflown] = useState(false);
  const theme = useTheme();

  const handleMouseOver = useCallback<MouseEventHandler<HTMLDivElement>>(() => {
    if (textRef.current) {
      setIsOverflown(textRef.current.offsetWidth < textRef.current.scrollWidth);
    }
  }, []);

  return (
    <StyledTooltipShield placement="top" {...tooltipProps} title={isOverflown && title}>
      <Typography
        {...labelProps}
        ref={textRef}
        sx={mergeSx(labelProps?.sx ?? {}, labelContainerSx, theme)}
        onMouseOver={handleMouseOver}
        component={"div"}
      >
        {label}
      </Typography>
    </StyledTooltipShield>
  );
};

export default OverflowTooltip;
