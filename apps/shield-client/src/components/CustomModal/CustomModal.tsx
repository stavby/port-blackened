import { Modal, Box, SxProps, Typography, IconButton, Fade } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { MODAL_FADE_TIMEOUT_MS } from "@helpers/constants";

const boxSX: SxProps = {
  position: "absolute",
  right: "50%",
  top: "50%",
  transform: "translate(50%, -50%)",
  bgcolor: "background.default",
  boxShadow: "20",
  borderRadius: "8px",
  outline: "none",
  width: "60%",
  height: "70%",
  overflow: "hidden",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  direction: "ltr",
};

export interface CustomModalProps {
  open: boolean;
  onClose?: () => void;
  onTransitionExited?: () => void;
  children: React.ReactNode;
  sx?: SxProps;
  title?: string;
  footer?: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({ open, onClose, onTransitionExited, children, sx, title, footer }) => {
  return (
    <Modal
      open={open}
      disableAutoFocus
      onClose={onClose}
      onTransitionExited={onTransitionExited}
      slotProps={{ backdrop: { timeout: MODAL_FADE_TIMEOUT_MS } }}
      closeAfterTransition
    >
      <Fade in={open} timeout={MODAL_FADE_TIMEOUT_MS}>
        <Box sx={{ ...boxSX, ...sx }} className="custom-modal-box">
          {!!title && (
            <Box
              width="100%"
              height="fit-content"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px="20px"
              py="8px"
              sx={{ backgroundColor: "white" }}
            >
              <Typography fontWeight={500} fontSize={18} variant="h6" color="#0E1E43">
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
            <Box width="100%" borderTop="1px solid #E1E1E8" mt="auto" display="flex" px="50px" pt="20px" pb="30px">
              {footer}
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default CustomModal;
