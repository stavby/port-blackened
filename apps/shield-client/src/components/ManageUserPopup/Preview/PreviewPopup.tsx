import { GeneralPopup } from "@components/Popup";
import { Divider } from "@mui/material";
import { User as UserIcon } from "@phosphor-icons/react";
import Preview, { PreviewProps } from "./Preview";
import { AccordionProvider } from "./AccordionProvider";

type Props = {
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
} & PreviewProps;

const PreviewPopup = ({ openModal, setOpenModal, ...previewProps }: Props) => {
  return (
    <GeneralPopup
      open={openModal}
      onClose={() => setOpenModal(false)}
      title="תצוגה מקדימה"
      titleIcon={
        <UserIcon
          style={{
            backgroundColor: "orange",
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
          }}
          fontSize={25}
          color="#fff"
        />
      }
      fullWidth={true}
      maxWidth={false}
      PaperProps={{
        style: {
          height: "90vh",
        },
      }}
      dialogContentProps={{
        sx: {
          px: 0,
        },
      }}
      disableBackdropClick
    >
      <Divider variant="fullWidth" sx={{ marginY: "8px" }} />
      <AccordionProvider>
        <Preview {...previewProps} />
      </AccordionProvider>
    </GeneralPopup>
  );
};

export default PreviewPopup;
