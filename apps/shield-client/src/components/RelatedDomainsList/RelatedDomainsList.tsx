import StyledTooltip from "@components/Tooltip";
import { useCalculateOverFlowItems } from "@helpers/useCalculateOverFlowItems";
import { Box, Grid, Stack, styled } from "@mui/material";
import { Permission } from "@types";
import { useRef } from "react";

interface RelatedDomainsListProps {
  related_domains: Permission["related_domains"];
}

const StyledDomainBox = styled(Box)(() => ({
  display: "inline-block",
  whiteSpace: "nowrap",
  height: "100%",
  border: "1px solid",
  borderRadius: "4px",
  padding: 5,
  boxSizing: "border-box",
  // backgroundColor: "#E8E9EC8A",
  borderColor: "#E5E7F9",
  direction: "ltr",
}));

export const RelatedDomainsList = ({ related_domains }: RelatedDomainsListProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overflowCount = useCalculateOverFlowItems(containerRef, [related_domains]);

  if (!related_domains) return <></>;

  return (
    <Grid container width="100%">
      {/**This Grid item is dummy for calculating overflowCount*/}
      <Grid item xs={12} display="flex" columnGap={1}>
        <Box display="flex" columnGap={1} ref={containerRef} maxWidth="90%" height="0px" sx={{ overflowX: "hidden", alignItems: "center" }}>
          {related_domains.map((domain) => (
            <StyledDomainBox key={domain._id}>{domain.display_name}</StyledDomainBox>
          ))}
        </Box>
      </Grid>
      {/**This Grid item is real*/}
      <Grid item xs={12} display="flex" columnGap={1}>
        <Box display="flex" columnGap={1} maxWidth="90%" sx={{ overflowX: "hidden", alignItems: "center" }}>
          {related_domains.slice(0, related_domains.length - overflowCount).map((domain) => (
            <StyledDomainBox key={domain._id}>{domain.display_name}</StyledDomainBox>
          ))}
        </Box>
        {overflowCount > 0 && (
          <StyledTooltip
            placement="top"
            title={
              <Stack spacing={{ xs: 1 }} direction="row" justifyContent="flex-end" useFlexGap flexWrap="wrap" maxWidth="20vw" py={1}>
                {related_domains.slice(related_domains.length - overflowCount).map((domain) => (
                  <StyledDomainBox
                    key={domain._id}
                    color="black"
                    fontWeight={500}
                    fontSize={14}
                    flex="1 0 auto"
                    maxWidth="calc(max(15em, 50%))"
                    textOverflow="ellipsis"
                    overflow="hidden"
                    whiteSpace="nowrap"
                    textAlign="center"
                    title={domain.display_name}
                    sx={{ backgroundColor: "#E5E7F9" }}
                  >
                    {domain.display_name}
                  </StyledDomainBox>
                ))}
              </Stack>
            }
          >
            <StyledDomainBox>{`+${overflowCount}`}</StyledDomainBox>
          </StyledTooltip>
        )}
      </Grid>
    </Grid>
  );
};
