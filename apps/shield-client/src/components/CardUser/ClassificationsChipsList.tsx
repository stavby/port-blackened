import StyledTooltipShield from "@components/Tooltip/StyledTooltip";
import { useCalculateOverFlowItems } from "@helpers/useCalculateOverFlowItems";
import { Box, Chip, ChipProps, Grid, Typography, chipClasses, styled } from "@mui/material";
import { useMemo, useRef } from "react";
import { Permission } from "../../types/permissions_types";

interface ClassificationChipsListProps {
  classifications: Pick<Permission, "_id" | "name">[];
  domainId: string;
}

export const StyledClassificationChip = styled((props: ChipProps) => <Chip variant="outlined" {...props} />)(() => ({
  border: "1px solid #667085",
  backgroundColor: "#F2F4F7",
}));

const ClassificationsChipsList = ({ classifications, domainId }: ClassificationChipsListProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overflowCount = useCalculateOverFlowItems(containerRef, [classifications]);
  const classificationChips = useMemo(
    () =>
      classifications.map((classification) => (
        <StyledClassificationChip key={`${domainId}-${classification._id}`} label={classification.name} />
      )),
    [domainId, classifications],
  );

  return (
    <Grid container width="100%">
      {classifications.length === 0 ? (
        <Typography width="100%" textAlign="center" variant="body2" color="gray">
          לא הוחלו סיווגים
        </Typography>
      ) : (
        <>
          {/**This Grid item is dummy for calculating overflowCount*/}
          <Grid item xs={12} display="flex" columnGap={1}>
            <Box
              display="flex"
              height="0px"
              maxWidth="90%"
              columnGap={1}
              sx={{
                overflowX: "hidden",
              }}
              ref={containerRef}
            >
              {classificationChips}
            </Box>
          </Grid>
          {/**This Grid item is real*/}
          <Grid item xs={12} display="flex" columnGap={1}>
            <Box
              display="flex"
              maxWidth="90%"
              columnGap={1}
              sx={{
                overflowX: "hidden",
              }}
            >
              {classificationChips.slice(0, classificationChips.length - overflowCount)}
            </Box>
            {overflowCount > 0 && (
              <StyledTooltipShield
                title={
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    py={1}
                    gap={1}
                    flexWrap="wrap"
                    maxWidth="20vw"
                    bgcolor="inherit"
                    borderRadius="inherit"
                  >
                    {classificationChips.slice(classificationChips.length - overflowCount)}
                  </Box>
                }
              >
                <Chip
                  variant="outlined"
                  label={`+${overflowCount}`}
                  sx={{
                    padding: 0,
                    border: "1px solid #667085",
                    backgroundColor: "#F2F4F7",
                    [`& .${chipClasses.label}`]: {
                      pr: 1,
                      pl: 1,
                    },
                  }}
                />
              </StyledTooltipShield>
            )}
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default ClassificationsChipsList;
