import { Box, Button, Typography } from "@mui/material";

interface ContactModalFooterProps {
  onClose: () => void;
}

const ContactModalFooter = ({ onClose }: ContactModalFooterProps) => {
  return (
    <Box display="flex" width="100%" justifyContent="space-around">
      <Button
        variant="outlined"
        id="button_contact_close"
        sx={{ width: "30%", borderRadius: 2, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
        onClick={() => {
          onClose();
        }}
      >
        <Typography fontWeight="bold">ביטול</Typography>
      </Button>
      <Button id="button_contact_submit" variant="contained" type="submit" form="contactForm" sx={{ width: "30%", borderRadius: 2 }}>
        שליחה
      </Button>
    </Box>
  );
};

export default ContactModalFooter;
