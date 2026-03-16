import { Theme } from "@emotion/react";
import { Box, Button, SxProps } from "@mui/material";
import React from "react";

export type GeneralFormProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  cancel: () => void;
  style?: SxProps<Theme>;
  disableSave?: boolean;
  children: React.ReactNode;
};

export function GeneralForm({ onSubmit, cancel, style, disableSave = false, children }: GeneralFormProps) {
  return (
    <form dir="rtl" onSubmit={onSubmit} id="formiform">
      <Box
        sx={{
          padding: 2,
          margin: 1,
          ...style,
        }}
      >
        {children}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={cancel} variant="outlined" sx={{ margin: 0.5 }}>
          ביטול
        </Button>
        <Button type="submit" variant="contained" sx={{ margin: 0.5 }} disabled={disableSave}>
          שמירה
        </Button>
      </Box>
    </form>
  );
}
