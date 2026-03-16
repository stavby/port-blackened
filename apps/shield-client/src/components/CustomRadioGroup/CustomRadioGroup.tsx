import { FormControlLabel, Grid, GridProps, Radio, radioClasses, RadioGroup } from "@mui/material";

interface ICustomRadioGroupProps {
  id: string;
  name: string;
  value: any;
  variant?: "info" | "primary";
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  options: { label: React.ReactNode; value: any; disabled?: boolean }[];
  dimensions?: { width?: string; height?: string };
  labelColor?: { checked?: string; unchecked?: string };
  gridContainerProps?: GridProps;
  gridItemProps?: GridProps;
}

const CustomRadioGroup = ({
  id,
  name,
  value,
  variant = "primary",
  onChange,
  options,
  dimensions,
  labelColor = { checked: `${variant}.main`, unchecked: "rgb(118,118,118)" },
  gridContainerProps,
  gridItemProps,
}: ICustomRadioGroupProps) => {
  return (
    <RadioGroup id={id} name={name} value={value} onChange={onChange}>
      <Grid container {...gridContainerProps}>
        {options.map((option) => (
          <Grid item key={option.value} {...gridItemProps}>
            <FormControlLabel
              id={`radio_${id}_${option.value}`}
              className={`radio-${id}`}
              sx={{
                m: 0,
                border: "1px solid",
                borderColor: option.value === value ? `${variant}.main` : "divider",
                borderRadius: "8px",
                color: option.value === value ? labelColor.checked : labelColor.unchecked,
                ...dimensions,
              }}
              value={option.value}
              disabled={option.disabled}
              label={option.label}
              control={
                <Radio
                  size="small"
                  sx={{ px: 1, [`&.${radioClasses.checked}`]: { color: `${variant}.main` } }}
                  disabled={option.disabled}
                />
              }
            />
          </Grid>
        ))}
      </Grid>
    </RadioGroup>
  );
};

export default CustomRadioGroup;
