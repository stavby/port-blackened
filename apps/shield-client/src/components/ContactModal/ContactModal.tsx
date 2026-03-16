import Modal from "@port/components/modal";
import ContactForm from "./ContactForm";
import ContactModalFooter from "./ContactModalFooter";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useGetRequestTypes } from "@api/contact";
import { useModalContext } from "../../contexts/ContactUsModal";

const ContactModal = () => {
  const { isOpen, setModalOpen } = useModalContext();
  const onClose = () => setModalOpen("contactUs", false);
  const requestTypesQuery = useGetRequestTypes();

  return (
    <Modal
      open={isOpen.contactUs}
      title="איך אפשר לעזור?"
      onClose={onClose}
      sx={{ width: "50%", height: "85%", direction: "ltr" }}
      footer={<ContactModalFooter onClose={onClose} />}
    >
      {requestTypesQuery.isSuccess ? (
        <Box height="85%" overflow="auto">
          <ContactForm requestTypes={requestTypesQuery.data || []} onClose={onClose} />
        </Box>
      ) : (
        <div style={{ display: "flex", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", direction: "ltr" }}>
          {requestTypesQuery.isError ? <Alert severity="error">נראה שהיתה בעיה בפניה לג'ירה</Alert> : <CircularProgress size={70} />}
        </div>
      )}
    </Modal>
  );
};

export default ContactModal;
