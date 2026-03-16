import { GeneralPopup } from "@components/Popup";
import { Box, Button } from "@mui/material";
import { Trash } from "@phosphor-icons/react";
import { Dispatch, ReactNode } from "react";

type WarningDeletePopupProps = {
  openDelete: boolean;
  setOpenDelete: Dispatch<React.SetStateAction<boolean>>;
  handleConfirmDelete: () => void;
  title: string;
  children?: ReactNode;
};

export const WarningDeletePopup = ({ openDelete, setOpenDelete, handleConfirmDelete, title, children }: WarningDeletePopupProps) => {
  return (
    <GeneralPopup
      open={openDelete}
      onClose={() => {
        setOpenDelete(false);
      }}
      title={title}
      titleIcon={
        <Trash
          color="#FC5367"
          weight="duotone"
          fontSize={25}
          style={{
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
            backgroundColor: "#FFF3F4",
          }}
        />
      }
    >
      <Box sx={{ padding: 2, margin: 1 }}>
        <span>
          {children}
          <strong>שים לב: </strong>
          המשתמשים הנמצאים בקבוצה זו עומדים לאבד את ההרשאות שהוענקו להם, האם להמשיך בכל זאת?
        </span>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={() => {
            setOpenDelete(false);
          }}
          variant="outlined"
          color="warning"
          sx={{ margin: 0.5 }}
        >
          ביטול
        </Button>
        <Button type="submit" variant="contained" color="warning" onClick={handleConfirmDelete} sx={{ margin: 0.5 }}>
          מחיקה
        </Button>
      </Box>
    </GeneralPopup>
  );
};
