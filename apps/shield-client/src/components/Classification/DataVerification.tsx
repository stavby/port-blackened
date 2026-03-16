import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  accordionClasses,
  AccordionDetails,
  AccordionSummary,
  accordionSummaryClasses,
  Avatar,
  Box,
  Skeleton,
  Typography,
} from "@mui/material";
import { verifiedCheckmarkIcon } from "@port/components/icons";
import { VERIFICATION_CHECK_STAGES, VerificationStage } from "@port/shield-schemas";
import { VerificationCheckStage } from "./VerificationCheckStage";

type DataVerificationProps = {
  verificationStages: VerificationStage[] | undefined | null;
  setVerificationStages: React.Dispatch<React.SetStateAction<VerificationStage[] | undefined | null>>;
};

export const DataVerification = ({ verificationStages, setVerificationStages }: DataVerificationProps) => {
  const handleSetIsChecked = (stage: VerificationStage["stage"], isChecked: boolean) => {
    setVerificationStages((prev) =>
      prev?.length === VERIFICATION_CHECK_STAGES.length
        ? prev.map((item) => (item.stage === stage ? { ...item, is_checked: isChecked } : item))
        : [
            { stage, is_checked: isChecked },
            ...VERIFICATION_CHECK_STAGES.filter((staticData) => staticData.stage !== stage).map((staticData) => ({
              stage: staticData.stage,
              is_checked: false,
            })),
          ],
    );
  };

  return (
    <Accordion
      disableGutters
      sx={{
        pt: "20px",
        [`&.${accordionClasses.root}`]: {
          boxShadow: "none !important",
        },
        [`&.${accordionClasses.root}:before`]: {
          display: "none !important",
        },
      }}
      elevation={0}
    >
      <AccordionSummary
        expandIcon={<ExpandMore fontSize={"large"} />}
        sx={{
          flexDirection: "row-reverse",
          direction: "rtl",
          fontWeight: 500,
          [`& .${accordionSummaryClasses.content}`]: {
            my: 0,
            justifyContent: "flex-end",
          },
          [`& .${accordionSummaryClasses.expandIconWrapper}`]: {
            my: 0,
            justifyContent: "flex-start",
          },
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
          <Box display={"flex"} flexDirection={"row-reverse"} alignItems={"center"}>
            <Avatar src={verifiedCheckmarkIcon} alt="checkmark_icon" sx={{ width: 20, height: 20, mr: "25px" }} />
            <Typography variant="subtitle1" fontSize={16} fontWeight={700}>
              אימות מידע
            </Typography>
          </Box>
          <Typography variant="subtitle1" fontSize={16}>
            בצע את כל הבדיקות הנדרשות בכדי לאמת את פריט המידע עבור המשתמשים
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box display={"flex"} flexDirection={"row"} justifyContent={"space-between"}>
          <Box display={"flex"} flexDirection={"row"} width={"85%"} justifyContent={"space-between"}>
            {verificationStages === undefined
              ? [0, 1, 2].map((key) => (
                  <Skeleton
                    key={key}
                    variant={"rectangular"}
                    animation={"wave"}
                    width={180}
                    height={73}
                    sx={{ borderColor: "lightgray", borderWidth: "2px", borderStyle: "solid", padding: "12px" }}
                  />
                ))
              : VERIFICATION_CHECK_STAGES.map(({ stage, title, verificationText }) => (
                  <VerificationCheckStage
                    key={stage}
                    title={title}
                    verificationText={verificationText}
                    stage={stage}
                    isChecked={(verificationStages || []).find(({ stage: propStage }) => stage === propStage)?.is_checked || false}
                    setIsChecked={(isNewChecked) => handleSetIsChecked(stage, isNewChecked)}
                  />
                ))}
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
