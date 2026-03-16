import { Box, Typography } from "@mui/material";

export const ScreenTitle = ({ screenName, screenIcon }: { screenName: string; screenIcon: JSX.Element }) => {
  return (
    <Box textAlign="left" sx={{ display: "flex" }} flexDirection="row" alignItems="center" margin={1}>
      {screenIcon}
      <Typography variant="h5" fontWeight="bold">
        {screenName}
      </Typography>
    </Box>
  );
};
