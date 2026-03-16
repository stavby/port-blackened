import { WarningCircle } from "@phosphor-icons/react";
import { ReactNode } from "react";
import { GeneralPopup } from "..";

export const WarningPopup = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) => {
  return (
    <GeneralPopup
      open={open}
      onClose={onClose}
      title="שים לב"
      titleIcon={
        <WarningCircle
          color="#fff"
          fontSize={25}
          style={{
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
            backgroundColor: "#19B4A7",
          }}
        />
      }
    >
      {children}
    </GeneralPopup>
  );
};
