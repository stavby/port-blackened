import { Box, Typography } from "@mui/material";
import NoDomainsPic from "@assets/manageUserPopup/domains-empty.png";

export const NoDomains = () => {
  return (
    <Box>
      <img src={NoDomainsPic} />
      <Box>
        <Typography>{`מי אמר שאי אפשר להנות מכל העולמות?`}</Typography>
        <Typography>{`בטוחים שתדע להתאים למשתמש את עולמות התוכן הרלוונטים עבורו.`}</Typography>
      </Box>
    </Box>
  );
};
