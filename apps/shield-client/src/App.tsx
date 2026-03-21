import { BackgroundWrapper } from "@components";
import { MUI_LICENSE_KEY } from "@constants";
import { Alert, Snackbar } from "@mui/material";
import { LicenseInfo } from "@mui/x-data-grid-pro";
import "./App.css";
import { useSnackBarStore } from "./store/snackbarStore";
import { RouterConfig } from "./router";
import QueryClientProvider from "./contexts/QueryClient";
import LoadingProvider from "@contexts/Loading";
import ModalProvider from "./contexts/ContactUsModal";
import ContactModal from "@components/ContactModal/ContactModal";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// set mui pro
LicenseInfo.setLicenseKey(MUI_LICENSE_KEY);

function App() {
  const { msg, severity, open, closeSnackbar } = useSnackBarStore();

  return (
    <QueryClientProvider>
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <LoadingProvider>
        <ModalProvider>
          {/* BLACKEND */}
          {/* <ContactModal /> */}
          <BackgroundWrapper>
            <Snackbar open={open} onClose={closeSnackbar} autoHideDuration={3000} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
              <Alert severity={severity} variant="filled" sx={{ width: "100%" }}>
                {msg}
              </Alert>
            </Snackbar>
            <RouterConfig />
          </BackgroundWrapper>
        </ModalProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
