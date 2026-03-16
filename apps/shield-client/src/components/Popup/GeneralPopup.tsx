import { Close } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentProps, DialogTitle, IconButton, Typography } from "@mui/material";
import { ReactNode } from "react";

type DefaultActionButtonsProps = {
  onClose: () => void;
  handleSave: () => void;
  disableSave: boolean | undefined;
};

const DefaultActionButtons = ({ onClose, handleSave, disableSave }: DefaultActionButtonsProps) => (
  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
    <Button onClick={onClose} variant="outlined" sx={{ margin: 0.5 }}>
      ביטול
    </Button>
    <Button variant="contained" sx={{ margin: 0.5 }} onClick={handleSave} disabled={disableSave}>
      שמירה
    </Button>
  </Box>
);

type BaseGeneralPopupProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  titleIcon?: JSX.Element;
  dialogContentProps?: DialogContentProps;
  children: ReactNode;
  actionsButtonsProps?: PopupActionButtonsProps;
  disableCloseButton?: boolean;
  disableBackdropClick?: boolean;
};

type PopupActionButtonsProps =
  | {
      enable?: false;
    }
  | {
      enable: true;
      handleSave: () => void;
      disableSave?: boolean;
    }
  | {
      enable: true;
      slot: ReactNode;
    };

export type GeneralPopupProps = BaseGeneralPopupProps & Omit<React.ComponentProps<typeof Dialog>, "title"> & PopupActionButtonsProps;

export function GeneralPopup({
  open,
  onClose,
  title,
  titleIcon,
  children,
  dialogContentProps,
  actionsButtonsProps,
  disableCloseButton = false,
  disableBackdropClick = false,
  ...props
}: GeneralPopupProps) {
  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" && disableBackdropClick) {
          return;
        }
        onClose?.();
      }}
      dir="rtl"
      {...props}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", padding: 1, paddingBottom: 0 }}>
        <Typography fontWeight="bold" sx={{ fontWeight: "bold", padding: 2, display: "flex" }} component="div">
          {titleIcon}
          {title}
        </Typography>
        {!disableCloseButton && (
          <IconButton onClick={onClose} sx={{ maxHeight: "fit-content" }}>
            <Close />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent {...dialogContentProps}>{children}</DialogContent>
      {actionsButtonsProps && actionsButtonsProps.enable && (
        <DialogActions sx={{ width: "100%" }}>
          {"slot" in actionsButtonsProps ? (
            actionsButtonsProps.slot
          ) : (
            <DefaultActionButtons
              onClose={onClose}
              handleSave={actionsButtonsProps.handleSave}
              disableSave={actionsButtonsProps.disableSave}
            />
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
