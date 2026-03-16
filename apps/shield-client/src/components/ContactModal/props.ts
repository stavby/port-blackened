import { FormLabelProps, TextFieldProps } from "@mui/material";

const textFieldProps: TextFieldProps = {
  sx: { borderColor: "text.disabled" },
  InputProps: { sx: { backgroundColor: "white" } },
  fullWidth: true,
  FormHelperTextProps: { sx: { backgroundColor: "background.default" } },
};

const formLabelProps: FormLabelProps = {
  sx: { mb: 1, fontSize: 14 },
  focused: false,
};

export { textFieldProps, formLabelProps };
