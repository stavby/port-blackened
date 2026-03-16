import { Box, CssBaseline } from "@mui/material";
import { PropsWithChildren } from "react";

export const BackgroundWrapper = ({ children }: PropsWithChildren) => {
  return (
    <Box height="100%">
      <CssBaseline />
      {children}
    </Box>
  );
};
