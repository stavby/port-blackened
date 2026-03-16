import { Button, Grid } from "@mui/material";

interface TableClassificationActionButtonsProps {
  cleanCheckedBox: () => void;
  handleSave: () => void;
}

export const TableClassificationActionButtons = ({ cleanCheckedBox, handleSave }: TableClassificationActionButtonsProps) => {
  return (
    <Grid container columnGap={1} sx={{ width: "100%", justifyContent: "flex-end", m: 0.5 }}>
      <Grid item xs={1.5}>
        <Button onClick={cleanCheckedBox} variant="outlined" fullWidth>
          נקה בחירה
        </Button>
      </Grid>
      <Grid item xs={2.1}>
        <Button variant="contained" fullWidth onClick={handleSave}>
          שמירה
        </Button>
      </Grid>
    </Grid>
  );
};
