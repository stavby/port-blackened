import { Box, SxProps, Typography } from "@mui/material";
import TimeToRestPic from "@assets/time_to_rest.png";

type Props = {
  mainText: string;
  secondaryText?: string;
  sx?: SxProps;
};

export function NoData({ mainText, secondaryText, sx }: Props) {
  return (
    <Box width={1120} height={400} position="relative" sx={sx}>
      <img src={TimeToRestPic} width="inherit" height="inherit" />
      <Box
        sx={{
          position: "absolute",
          top: "40%",
          left: "48%",
        }}
      >
        <Typography
          sx={{
            fontSize: 24,
            color: "#3256DF",
            fontWeight: 500,
          }}
        >
          {mainText}
        </Typography>
        {secondaryText && (
          <Typography
            sx={{
              fontSize: 14,
              color: "text.secondary",
              fontWeight: 400,
            }}
          >
            {secondaryText}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
