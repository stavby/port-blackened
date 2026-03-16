import { getUserInfoDisplay, useLoggedUserInfo } from "@api/auth";
import StyledTooltip from "@components/Tooltip/StyledTooltip";
import MenuIcon from "@mui/icons-material/Menu";
import { Alert, Box, Skeleton, SkeletonProps, tooltipClasses } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { UnitIcons } from "@port/components/unitIcons";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, Reducer, useReducer } from "react";
import { ShieldLogo } from "../../../assets/images/ShieldLogo";
import { StyledCard, StyledCardContent, StyledCardHeader } from "../../../styles/CardStyle";
import { AppBar } from "./NavBar.styles";

interface NavBarProps {
  open?: boolean;
  handleDrawerOpen: () => void;
}

interface SkeletonWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  skeletonProps?: SkeletonProps;
}

const pageReducer: Reducer<number, "INCREMENT" | "DECREMENT"> = (prevPage, action) => {
  if (action === "INCREMENT") {
    return prevPage + 1;
  } else {
    return prevPage - 1;
  }
};

const SkeletonWrapper = ({ children, isLoading, skeletonProps }: SkeletonWrapperProps) => {
  return isLoading ? <Skeleton animation="wave" {...skeletonProps} /> : children;
};

interface RoleDomainsDisplayProps {
  roleDisplayName: string;
  domainDisplayNames: string[];
  isLoading: boolean;
}

const RoleDomainsDisplay = ({ roleDisplayName, domainDisplayNames, isLoading }: RoleDomainsDisplayProps) => {
  return (
    <>
      <StyledCard sx={{ width: "100%" }}>
        <SkeletonWrapper skeletonProps={{ width: "90%", height: "40px", sx: { mx: "auto" } }} isLoading={isLoading}>
          <StyledCardHeader title="רמת הרשאה" />
          <StyledCardContent>{roleDisplayName}</StyledCardContent>
        </SkeletonWrapper>
      </StyledCard>

      <StyledCard sx={{ maxHeight: "140px", width: "100%" }}>
        <SkeletonWrapper isLoading={isLoading} skeletonProps={{ width: "90%", height: "200px", sx: { mx: "auto" } }}>
          <StyledCardHeader title="עולמות תוכן" />
          <StyledCardContent>
            {domainDisplayNames.map((domainDisplayName) => (
              <Typography fontSize={"inherit"} height={20} key={domainDisplayName} color="black">
                {domainDisplayName}
              </Typography>
            ))}
          </StyledCardContent>
        </SkeletonWrapper>
      </StyledCard>
    </>
  );
};

const TooltipInfoContent = () => {
  const [currentPage, pageDispatch] = useReducer(pageReducer, 0);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["userInfoDisplay"],
    queryFn: getUserInfoDisplay,
    meta: {
      loading: false,
    },
  });

  if (isError) {
    <Alert severity="error" sx={{ fontWeight: "bold" }}>
      אוי לא! הייתה שגיאה בשרת
    </Alert>;
  }

  if (data?.isAdmin) {
    return (
      <Typography textAlign="center" color="black">
        הרשאת אדמין
      </Typography>
    );
  }

  if (data && data.roles.length === 0) {
    return (
      <Typography textAlign="center" color="black">
        נראה שאין לך תפקידים בשילד
      </Typography>
    );
  }

  const roles = data?.roles ?? [];
  const role = roles[currentPage];
  const numberOfRoles = roles.length;

  return (
    role && (
      <Box>
        <RoleDomainsDisplay
          roleDisplayName={role.displayName}
          domainDisplayNames={role.domainDisplayNames}
          isLoading={isLoading}
          key={role.displayName}
        />

        <Box height={20} display="flex" width="100%">
          {currentPage + 1 < numberOfRoles && (
            <IconButton
              onClick={(event) => {
                event.stopPropagation();
                pageDispatch("INCREMENT");
              }}
              size="small"
            >
              <ArrowLeft />
            </IconButton>
          )}
          {currentPage > 0 && (
            <IconButton
              onClick={(event) => {
                console.log("onClick dec");
                event.stopPropagation();
                pageDispatch("DECREMENT");
              }}
              size="small"
              sx={{ mr: "auto" }}
            >
              <ArrowRight />
            </IconButton>
          )}
        </Box>
      </Box>
    )
  );
};

const TooltipInfo = () => {
  return (
    <Box display="flex" flexDirection="column" py={1} borderRadius="inherit" width={200}>
      <TooltipInfoContent />
    </Box>
  );
};

export default function NavBar({ open, handleDrawerOpen }: NavBarProps) {
  const { data: user } = useLoggedUserInfo();

  return (
    <AppBar position="fixed" sx={{ height: "64px" }} open={open}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box display="flex">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: "flex" }}>
            <ShieldLogo />
          </Box>
        </Box>
        <Box display="flex" gap="15px">
          <Box
            sx={{
              fontFamily: "Rubik, sans-serif",
              fontSize: 24,
            }}
          >
            <StyledTooltip
              placement="bottom"
              title={<TooltipInfo />}
              disableFocusListener
              sx={{
                [`& .${tooltipClasses.tooltip}`]: {
                  backgroundColor: "white",
                },
              }}
            >
              <Typography variant="inherit">{user?.fullName}</Typography>
            </StyledTooltip>
          </Box>
          <UnitIcons />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
