import { Box } from "@mui/material";
import React, { CSSProperties, ForwardedRef, ReactNode, forwardRef } from "react";

type SelectableSegmentProps = React.ComponentProps<typeof Box> & {
  title?: string;
  icon?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  selectedStyle?: CSSProperties;
};

export default forwardRef(function SelectableSegment(
  { title, icon, onClick, selected, selectedStyle, style, ...boxProps }: SelectableSegmentProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const finalBoxStyle = selected && selectedStyle ? { ...(style ?? {}), ...selectedStyle } : style;
  return (
    <Box onClick={onClick} {...boxProps} ref={ref} sx={{ ":hover": { cursor: "pointer" }, ...finalBoxStyle }}>
      {icon} {title}
    </Box>
  );
});
