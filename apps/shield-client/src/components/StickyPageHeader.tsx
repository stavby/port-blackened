import { Box, SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";

type StickyPageHeaderParams = {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export const StickyPageHeader = ({ children, sx }: StickyPageHeaderParams) => (
  <Box
    position={"sticky"}
    top={"64px"}
    zIndex={1}
    bgcolor={"background.default"}
    pb={3}
    sx={{
      ...sx,
      boxShadow: "0 4px 2px -2px rgba(0, 0, 0, 0.15)",
    }}
  >
    {children}
  </Box>
);
