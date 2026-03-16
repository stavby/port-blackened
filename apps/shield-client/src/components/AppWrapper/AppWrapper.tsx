import { useLoggedUserInfo } from "@api/auth";
import Box from "@mui/material/Box";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppDrawer } from "./AppDrawer";
import NavBar from "./NavBar/NavBar";

export const APP_WRAPPER_ID = "shield-app-wrapper";

export function AppWrapper() {
  const [open, setOpen] = useState(false);
  const { data: userInfo } = useLoggedUserInfo();

  const handleDrawerOpen = () => {
    setOpen((prevState) => !prevState);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <NavBar open={open} handleDrawerOpen={handleDrawerOpen} />
      <AppDrawer open={open} handleDrawerClose={handleDrawerClose} />
      <Box
        id={APP_WRAPPER_ID}
        component="main"
        sx={{
          flexGrow: 1,
          paddingX: 7,
          zIndex: 1,
          marginTop: "64px",
          paddingBottom: "64px",
          overflowY: "auto",
          backgroundColor: "background.default",
        }}
      >
        <Box zIndex={1} position={"sticky"} top={0} bgcolor={"background.default"} height={"64px"}></Box>
        {userInfo && <Outlet />}
      </Box>
    </Box>
  );
}
