import { createTheme } from "@mui/material";

export const theme = createTheme({
  typography: {
    fontFamily: "Heebo, sans-serif",
  },
  palette: {
    background: {
      default: "#FCFCFD",
    },
    primary: {
      main: "#3256df",
    },
    secondary: {
      main: "#f2f4f7",
    },
    text: {
      primary: "#000",
      secondary: "#101828",
    },
    warning: {
      main: "#FC5367",
    },
    light: {
      main: "#FFF",
    },
  },
  direction: "rtl",
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          background: "linear-gradient(to right, #24a8f6, #4f67c2)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});
