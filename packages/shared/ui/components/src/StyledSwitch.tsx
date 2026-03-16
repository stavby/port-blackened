import { styled, Switch, SwitchProps } from "@mui/material";

const StyledSwitch = styled((props: SwitchProps) => <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />)(
  ({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    "& .MuiSwitch-switchBase": {
      padding: 0,
      margin: 2,
      transitionDuration: "300ms",
      "&.Mui-checked": {
        transform: "translateX(16px)",
        color: "#FFF",
        "& + .MuiSwitch-track": {
          backgroundColor: theme.palette.success.main,
          opacity: 1,
          border: 0,
        },
        "&.Mui-disabled + .MuiSwitch-track": {
          opacity: 0.5,
        },
      },
      "&.Mui-focusVisible .MuiSwitch-thumb": {
        color: "#33CF4D",
        border: "6px solid #FFF",
      },
      "&.Mui-disabled .MuiSwitch-thumb": {
        color: "#FFF",
        opacity: 0.7,
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: theme.palette.mode === "light" ? 0.5 : 0.3,
      },
    },
    "& .MuiSwitch-thumb": {
      boxSizing: "border-box",
      width: 22,
      height: 22,
    },
    "& .MuiSwitch-track": {
      borderRadius: 13,
      backgroundColor: theme.palette.mode === "light" ? "#39393D" : "gray",
      opactity: 1,
      transition: theme.transitions.create(["background-color"], {
        duration: 500,
      }),
    },
  }),
);

export default StyledSwitch;
