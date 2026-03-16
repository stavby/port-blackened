import { Box, Typography } from "@mui/material";
import NoPermissionTablesSvg from "@assets/manageUserPopup/permission-tables-empty.svg";

export const NoPermissionTables = () => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" width="100%">
      <img src={NoPermissionTablesSvg} width={400} height={330} />
      <Box>
        <Typography textAlign="center">עולם חדש של סינון - שליטה חכמה בחשיפה למידע.</Typography>
        <Typography textAlign="center">התאימו את המידע שמוצג למשתמש והבטיחו גישה רק למה שרלוונטי עבורו</Typography>
      </Box>
    </Box>
  );
};
