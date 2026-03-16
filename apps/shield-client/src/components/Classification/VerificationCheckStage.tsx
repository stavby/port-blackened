import { VERIFICATION_STAGE_ICONS } from "@assets/icons/verificationStageIcons";
import { GeneralPopup } from "@components/Popup";
import { Avatar, Box, Button, Checkbox, Divider, Link, Paper, Typography } from "@mui/material";
import { VerificationStageName } from "@port/shield-schemas";
import { useEffect, useState } from "react";

type VerificationCheckStageProps = {
  stage: VerificationStageName;
  title: string;
  verificationText: string;
  isChecked: boolean;
  setIsChecked: (isNewChecked: boolean) => void;
};

export const VerificationCheckStage = ({ title, verificationText, isChecked, setIsChecked, stage }: VerificationCheckStageProps) => {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isCheckedInConfirmation, setIsCheckedInConfirmation] = useState(isChecked);

  useEffect(() => {
    setIsCheckedInConfirmation(isChecked);
  }, [isChecked]);

  const handleConfirm = () => {
    setIsChecked(isCheckedInConfirmation);
    setIsConfirmationOpen(false);
  };

  const handleCancel = () => {
    setIsCheckedInConfirmation(isChecked);
    setIsConfirmationOpen(false);
  };

  return (
    <Paper elevation={0} sx={{ borderColor: "lightgray", borderWidth: "2px", borderStyle: "solid", padding: "12px" }}>
      <Box display={"flex"} flexDirection={"row"}>
        <Avatar src={VERIFICATION_STAGE_ICONS[stage]} alt="checkmark_icon" sx={{ width: 20, height: 20, mr: "10px" }} />
        <Typography color={"grey"} fontSize={14} fontWeight={700}>
          {title}
        </Typography>
      </Box>
      <Link
        sx={{ textDecoration: "none", cursor: "pointer", userSelect: "none", fontSize: 14, fontWeight: isChecked ? "bold" : "normal" }}
        onClick={() => setIsConfirmationOpen(true)}
      >
        {isChecked ? "הושלם" : "בצע אימות"}
      </Link>
      {isConfirmationOpen && (
        <GeneralPopup
          open={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          disableEscapeKeyDown
          disableCloseButton
          disableBackdropClick
          title={
            <Typography color={"grey"} fontWeight={700} sx={{ direction: "rtl" }}>
              {title}
            </Typography>
          }
          titleIcon={<Avatar src={VERIFICATION_STAGE_ICONS[stage]} alt="checkmark_icon" sx={{ width: 25, height: 25, mr: "25px" }} />}
          dir="rtl"
          PaperProps={{ sx: { width: "25vw", height: "23vh" } }}
          actionsButtonsProps={{
            enable: true,
            slot: (
              <Box width="100%" position={"relative"}>
                <Divider variant="fullWidth" sx={{ marginY: "10px" }} />
                <Box display={"flex"} flexDirection={"row-reverse"} gap={"10px"} position={"absolute"} right={0} my={"10px"} mr={"10px"}>
                  <Button variant="contained" fullWidth onClick={handleConfirm}>
                    שמירה
                  </Button>
                  <Button onClick={handleCancel} variant="outlined" fullWidth>
                    ביטול
                  </Button>
                </Box>
              </Box>
            ),
          }}
          dialogContentProps={{ sx: { flex: "unset", display: "block" } }}
        >
          <Box display={"flex"} flexDirection={"row"} alignItems={"center"} mt="15px" height={"40px"}>
            <Checkbox checked={isCheckedInConfirmation} onChange={(e) => setIsCheckedInConfirmation(e.target.checked)} />
            <Typography dir={"rtl"} sx={{ overflow: "auto", maxHeight: "75px" }}>
              {verificationText}
            </Typography>
          </Box>
        </GeneralPopup>
      )}
    </Paper>
  );
};
