import { Box, FormControl, FormControlProps, FormLabel, IconButton, Link, MenuItem } from "@mui/material";
import { UseControllerReturn } from "react-hook-form";
import { ContactRequest, RequestType } from "../../types/contact.models";
import StyledTextField from "../../styles/StyledTextField";
import { formLabelProps, textFieldProps } from "./props";
import StyledSelect from "../../styles/StyledSelect";
import DeleteIcon from "@mui/icons-material/Delete";

const text: Record<keyof ContactRequest, string> = {
  summary: "תקציר",
  requestType: "למה אתם פה?",
  customfield_14200: "מערכת",
  customfield_10706: "השפעה",
  customfield_11502: "טלפון ליצירת קשר למקרים דחופים",
  attachment: "אם רלוונטי נשמח שתצרפו תמונה או קובץ",
  description: "פירוט",
};
const FormControlLabel = ({
  fieldId,
  required,
  children,
  ...formControlProps
}: { children: React.ReactElement; fieldId: RequestType["fields"][number]["fieldId"]; required: boolean } & FormControlProps) => {
  return (
    <FormControl {...formControlProps}>
      <FormLabel {...formLabelProps} required={required}>
        {text[fieldId]}
      </FormLabel>
      {children}
    </FormControl>
  );
};

export const FieldInput = ({ field, controller }: { field: RequestType["fields"][number]; controller: UseControllerReturn<any, any> }) => {
  switch (field.fieldId) {
    case "summary":
      return (
        <FormControlLabel fieldId={field.fieldId} required={field.required} sx={{ width: "60%" }}>
          <StyledTextField
            name={controller.field.name}
            value={controller.field.value}
            onChange={controller.field.onChange}
            onBlur={controller.field.onBlur}
            error={!!controller.fieldState.error}
            helperText={controller.fieldState.error?.message}
            type="text"
            {...textFieldProps}
            InputProps={{ ...textFieldProps.InputProps, sx: { ...textFieldProps.InputProps?.sx, height: 50 } }}
          />
        </FormControlLabel>
      );
    case "description":
      return (
        <FormControlLabel fieldId={field.fieldId} required={field.required} fullWidth>
          <StyledTextField
            id="contact_description"
            placeholder="פירוט הפנייה..."
            multiline
            rows={6}
            name={controller.field.name}
            value={controller.field.value}
            onChange={controller.field.onChange}
            onBlur={controller.field.onBlur}
            error={!!controller.fieldState.error}
            helperText={controller.fieldState.error?.message}
            {...textFieldProps}
          />
        </FormControlLabel>
      );
    case "customfield_11502":
      return (
        <FormControlLabel fieldId={field.fieldId} required={field.required} sx={{ width: "40%" }}>
          <StyledTextField
            name={controller.field.name}
            value={controller.field.value}
            onChange={controller.field.onChange}
            onBlur={controller.field.onBlur}
            error={!!controller.fieldState.error}
            helperText={controller.fieldState.error?.message}
            type="tel"
            {...textFieldProps}
            InputProps={{ ...textFieldProps.InputProps, sx: { ...textFieldProps.InputProps?.sx, height: 50 } }}
          />
        </FormControlLabel>
      );
    case "customfield_10706":
      return (
        <FormControlLabel fieldId={field.fieldId} required={field.required} sx={{ width: "35%" }}>
          <StyledSelect
            name={controller.field.name}
            value={controller.field.value}
            onChange={controller.field.onChange}
            onBlur={controller.field.onBlur}
            error={!!controller.fieldState.error}
          >
            {field.validValues.map((value) => (
              <MenuItem value={value.value} key={value.value}>
                {value.label}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControlLabel>
      );
    case "customfield_14200":
      return (
        <FormControlLabel fieldId={field.fieldId} required={field.required} sx={{ width: "35%" }}>
          <StyledSelect
            name={controller.field.name}
            value={controller.field.value}
            onChange={controller.field.onChange}
            onBlur={controller.field.onBlur}
            error={!!controller.fieldState.error}
            disabled={!!controller.field.value}
          >
            {field.validValues.map((value) => (
              <MenuItem value={value.value} key={value.value}>
                {value.label}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControlLabel>
      );
    case "attachment":
      return (
        <FormControlLabel fieldId={field.fieldId} required={field.required} sx={{ width: "40%" }}>
          <>
            <input
              id="fileInput"
              name={controller.field.name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                controller.field.onChange(event.target.files?.[0]);
              }}
              type="file"
              hidden
            />
            <Box
              height={50}
              p={1.5}
              bgcolor="white"
              borderRadius={3}
              border={1}
              borderColor="text.disabled"
              display="flex"
              justifyContent="space-between"
            >
              <label htmlFor="fileInput">
                <Link sx={{ cursor: "pointer", fontWeight: 500 }}>{controller.field.value?.name || "העלאת קובץ"}</Link>
              </label>
              {!!controller.field.value?.name && (
                <IconButton id="button_delete_fileInput" onClick={() => controller.field.onChange(null)} sx={{ p: 0 }}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </>
        </FormControlLabel>
      );

    default:
      return <></>;
  }
};
