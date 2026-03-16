"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Fade, IconButton, Modal as MuiModal, PaletteMode, SxProps, Typography } from "@mui/material";

const boxSX = (mode: PaletteMode): SxProps => ({
  position: "absolute",
  right: "50%",
  top: "50%",
  transform: "translate(50%, -50%)",
  bgcolor: mode === "dark" ? "background.paper" : "background.default",
  boxShadow: "20",
  borderRadius: "8px",
  outline: "none",
  width: "60%",
  height: "70%",
  overflow: "hidden",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
});

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  closeOnOutsideClick?: boolean;
  onTransitionExited?: () => void;
  children: React.ReactNode;
  sx?: SxProps;
  title?: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, closeOnOutsideClick = true, onTransitionExited, children, sx, title, footer }) => {
  return (
    <MuiModal
      open={open}
      disableAutoFocus
      onClose={closeOnOutsideClick ? onClose : undefined}
      onTransitionExited={onTransitionExited}
      slotProps={{ backdrop: { timeout: 300 } }}
      closeAfterTransition
    >
      <Fade in={open} timeout={300}>
        <Box sx={(theme) => ({ ...boxSX(theme.palette.mode), ...sx })} className="custom-modal-box">
          {!!title && (
            <Box
              width="100%"
              height="fit-content"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px="20px"
              py="8px"
              bgcolor={(theme) => (theme.palette.mode === "dark" ? "background.default" : "background.paper")}
            >
              <Typography
                fontWeight={500}
                fontSize={18}
                variant="h6"
                color={(theme) => (theme.palette.mode === "dark" ? "white" : "#0E1E43")}
              >
                {title}
              </Typography>
              {!!onClose && (
                <IconButton id="close_modal" onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          )}
          {children}
          {!!footer && (
            <Box
              width="100%"
              borderTop={(theme) => (theme.palette.mode === "light" ? "1px solid #E1E1E8" : "1px solid #101010")}
              mt="auto"
              display="flex"
              px="50px"
              pt="20px"
              pb="30px"
            >
              {footer}
            </Box>
          )}
        </Box>
      </Fade>
    </MuiModal>
  );
};

export default Modal;
