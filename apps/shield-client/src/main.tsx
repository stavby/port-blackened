import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@mui/material";
import { theme } from "./themes/index.ts";
import { cacheRtl } from "./rtl-plugin/index.ts";
import { CacheProvider } from "@emotion/react";
import axios, { HttpStatusCode } from "axios";
import { LOGIN_ENDPOINT } from "./constants/index.ts";

// set with credentials true for all requests
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    /** if user is unauthenticated redirect to login endpoint on serverside */
    if (err.response?.status === HttpStatusCode.Unauthorized) {
      const pathname = window.location.pathname;
      const redirectTo = encodeURIComponent(pathname.startsWith("/") ? pathname.slice(1) : pathname);
      window.location.href = LOGIN_ENDPOINT(redirectTo);
    }

    return Promise.reject(err);
  },
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </CacheProvider>
  </React.StrictMode>,
);
