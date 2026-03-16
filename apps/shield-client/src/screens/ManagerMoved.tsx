import MovedSite from "@assets/moved_site.jpg";
import { Box, Link } from "@mui/material";

const ManagerMoved = () => {
  return (
    <Box display="flex" width="100%" height="100%" alignItems="center" justifyContent="center">
      <Box display="flex" width="80%" height="80%" flexDirection="column" alignItems="center" rowGap={1}>
        <img src={MovedSite} alt="עברנו אתר" />
        <Link
          onClick={() =>
            window.open(
              import.meta.env.VITE_PLATFORM_URL ? `${import.meta.env.VITE_PLATFORM_URL}/user-management` : "http://fakeurl",
              "_blank",
            )
          }
          sx={{ width: "40%", cursor: "pointer" }}
        >
          לחץ כאן כדי לעבור לאתר החדש
        </Link>
      </Box>
    </Box>
  );
};

export default ManagerMoved;
