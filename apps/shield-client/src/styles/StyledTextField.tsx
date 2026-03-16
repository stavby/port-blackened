import { styled, TextField, TextFieldProps } from "@mui/material";
import { ForwardedRef, forwardRef } from "react";

const StyledFormHelperTextProps = { sx: { direction: "rtl", textAlign: "right", height: 0, my: 0, py: 0 } };

const UnstyledTextField = (props: TextFieldProps) => (
  <TextField {...props} autoComplete="off" FormHelperTextProps={StyledFormHelperTextProps} />
);

const FrUnstyledTextField = forwardRef(function InnerUnstyledTextField(props: TextFieldProps, ref: ForwardedRef<HTMLInputElement>) {
  return <UnstyledTextField {...props} inputRef={ref} />;
});

const styledConf = {
  "& .MuiInputBase-root": {
    borderRadius: "10px",
  },
  "& .MuiInputBase-input": {
    paddingBlock: "8px",
  },
  "& .MuiInputBase-root.Mui-disabled": {
    backgroundColor: "#EDEDF4",
  },
  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: "#75769A",
    color: "#75769A",
  },
  "& .MuiInputBase-root.Mui-disabled fieldset": {
    border: "none",
  },
};

const StyledTextField = styled(UnstyledTextField)(() => styledConf);
const FrStyledTextField = styled(FrUnstyledTextField)(() => styledConf);

export default StyledTextField;
export { FrStyledTextField, StyledFormHelperTextProps };
