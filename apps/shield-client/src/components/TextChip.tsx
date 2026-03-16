import { Typography } from "@mui/material";

type Props = {
  children: string;
};

export function TextChip({ children }: Props) {
  return (
    <Typography
      sx={{
        fontWeight: "bold",
        fontSize: 14,
        padding: "2px 4px",
        backgroundColor: "#F2F4F7",
        border: 1,
        borderColor: "#667085",
        borderRadius: 10,
        color: "#475467",
        textAlign: "center",
        maxWidth: "25%",
      }}
    >
      {children}
    </Typography>
  );
}
