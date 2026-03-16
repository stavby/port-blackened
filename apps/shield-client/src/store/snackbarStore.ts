import { getErrorMessage } from "@helpers/handleErrorMessage";
import { AlertColor } from "@mui/material";
import { create } from "zustand";

type Snackbar = {
    open: boolean;
    severity: AlertColor;
    msg: string;
    // setSnackbar: (severity: AlertColor, msg: string) => void;
    setSnackbarSuccess: (description: string) => void;
    setSnackbarError: (description: string, error?: unknown) => void;
    closeSnackbar: () => void;
};

export const useSnackBarStore = create<Snackbar>()((set) => ({
    open: false,
    severity: "" as AlertColor,
    msg: "",
    // setSnackbar: (severity: AlertColor, msg: string) =>
    //   set({ open: true, msg: msg, severity: severity }),
    closeSnackbar: () => set({ open: false }),
    setSnackbarSuccess: (description: string) => set({ open: true, msg: description, severity: "success" }),
    setSnackbarError: (description: string, err?: unknown) =>
        set({
            open: true,
            msg: `${description}: ${getErrorMessage(err)}`,
            severity: "error",
        }),
}));
