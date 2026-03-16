"use client";

import { Avatar, Box, TooltipProps, Typography } from "@mui/material";
import { StyledTooltip } from "./StyledTooltip";
import { binaLogo, shaharLogo, tikshuvLogo } from "./icons";

type UnitIconsProps = {
  placement?: TooltipProps["placement"];
};

const LOGOS: { id: string; logo: any }[] = [
  { id: "shahar", logo: shaharLogo },
  { id: "bina", logo: binaLogo },
  { id: "tikshuv", logo: tikshuvLogo },
];

export const UnitIcons = ({ placement }: UnitIconsProps) => {
  return (
    <StyledTooltip
      disableMaxWidth
      title={
        <Box>
          <Typography sx={{ direction: "ltr", fontWeight: "bold", whiteSpace: "nowrap" }}>
            פותח ע"י יחידת שחר/חטיבת בינה/אגף התקשוב
          </Typography>
        </Box>
      }
      placement={placement || "bottom"}
    >
      <Box sx={{ flexGrow: 0.01, display: "flex", flexDirection: "row", gap: "10px" }}>
        {LOGOS.map(({ id, logo }) => (
          <img key={id} src={typeof logo === "string" ? logo : logo?.src} height={"40px"} width={"40px"} />
        ))}
      </Box>
    </StyledTooltip>
  );
};
