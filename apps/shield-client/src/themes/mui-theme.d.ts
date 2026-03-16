import { type PaletteColorOptions, type PaletteColor } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    light: PaletteColor;
  }

  interface PaletteOptions {
    light?: PaletteColorOptions;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    light: true;
  }
}
