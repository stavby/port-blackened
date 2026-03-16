import "../App.css";
import "../App.css";
import { Box, Button, Typography } from "@mui/material";
import { ShieldLogo } from "../assets/images/ShieldLogo";
import NoPermissionsImage from "../assets/no_permissions.png";
import { useModalContext } from "../contexts/ContactUsModal";

interface UnauthorizedProps {
  showLogo?: boolean;
}

function Unauthorized({ showLogo = false }: UnauthorizedProps) {
  const { setModalOpen } = useModalContext();

  return (
    <Box
      sx={{ backgroundImage: `url(${NoPermissionsImage})`, backgroundSize: "1120px 400px" }}
      height="400px"
      width="1120px"
      position="relative"
    >
      <Box
        sx={{
          position: "absolute",
          top: "17%",
          left: "44%",
        }}
      >
        {showLogo && <ShieldLogo shieldTextColor="#3A88DC" />}
        <Typography
          sx={{
            fontSize: 24,
            color: "#3256DF",
            fontWeight: 500,
          }}
        >
          נראה שאין לך הרשאות
        </Typography>
        <Button sx={{ m: 2 }} variant="contained" color="primary" onClick={() => setModalOpen("contactUs", true)}>
          בקשת הרשאה
        </Button>
      </Box>
    </Box>
  );
}

export default Unauthorized;
