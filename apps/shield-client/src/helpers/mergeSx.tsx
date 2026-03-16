import { Theme, SxProps } from "@mui/material";

export const mergeSx = (sx: SxProps<Theme>, additonalStyles: SxProps<Theme>, theme: Theme) => {
  let baseSx: SxProps<Theme> = {};

  if (typeof sx === "function") {
    baseSx = sx(theme);
  } else if (Array.isArray(sx)) {
    baseSx = sx.reduce(
      (acc, item) => ({
        ...acc,
        ...(typeof item === "function" ? item(theme) : item),
      }),
      {},
    );
  } else if (typeof sx === "object") {
    baseSx = sx;
  }

  return {
    ...baseSx,
    ...additonalStyles,
  };
};
