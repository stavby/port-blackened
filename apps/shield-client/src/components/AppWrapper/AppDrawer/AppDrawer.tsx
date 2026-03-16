import { useTasksQuery } from "@api/tasks";
import DomainsIcon from "@assets/icons/DomainsIcon";
import TablesIcon from "@assets/icons/TablesIcon";
import MessageQuestion from "@assets/MessageQuestion";
import StyledTooltipShield from "@components/Tooltip";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Fade } from "@mui/material";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useTheme } from "@mui/material/styles";
import { Briefcase, Key, ListChecks, UsersThree, CirclesFour } from "@phosphor-icons/react";
import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { useModalContext } from "../../../contexts/ContactUsModal";
import { Drawer, DrawerHeader } from "./AppDrawer.styles";

type DrawerItem = {
  description: string;
  icon: JSX.Element;
  path: string;
  divider?: boolean;
};

export const drawerItems: DrawerItem[] = [
  {
    description: "המשימות שלי",
    icon: <ListChecks size={24} color="#5f5858" weight="duotone" />,
    path: "/myTasks",
  },
  {
    description: "סיווג טבלאות",
    icon: <TablesIcon />,
    path: "/classifyTables",
  },
  {
    description: "ניהול סיווגים",
    icon: <Key size={24} color="#5f5858" weight="duotone" />,
    path: "/permissions",
  },
  {
    description: "ניהול קבוצות הרשאה",
    icon: <CirclesFour size={24} color="#5f5858" weight="duotone" />,
    path: "/permissionGroups",
  },
  {
    description: "ניהול משתמשים",
    icon: <UsersThree size={24} color="#5f5858" weight="duotone" />,
    path: "/manageUsers",
  },
  {
    description: "ניהול עולמות תוכן",
    icon: <DomainsIcon />,
    path: "/domains",
  },
  {
    description: "מסך מנהל",
    icon: <Briefcase size={24} color="#5f5858" weight="duotone" />,
    path: "/manager",
  },
];

interface AppDrawerProps {
  open: boolean;
  handleDrawerClose: () => void;
}

export function AppDrawer({ open, handleDrawerClose }: AppDrawerProps) {
  const theme = useTheme();
  const location = useLocation();
  const { setModalOpen } = useModalContext();
  const { data: tasks, isFetching } = useTasksQuery({ enabled: open });

  return (
    <>
      <Box flexShrink={0} sx={{ width: `calc(${theme.spacing(5)} + 1px)` }} />
      <Drawer variant="permanent" open={open} ModalProps={{ keepMounted: true }}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>{theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}</IconButton>
        </DrawerHeader>
        <Divider />

        <List style={{ height: "100%", display: "flex", justifyContent: "space-between", flexDirection: "column" }}>
          <Box>
            {drawerItems.map(({ description, icon, path, divider }) => {
              return (
                <Fragment key={path}>
                  <ListItem disablePadding sx={{ display: "block" }}>
                    <Link to={path} onClick={handleDrawerClose}>
                      <StyledTooltipShield placement="left" title={!open ? description : ""}>
                        <ListItemButton
                          sx={{
                            minHeight: 48,
                            justifyContent: open ? "initial" : "center",
                            color: "text.secondary",
                            m: 1,
                            borderRadius: "10px",
                          }}
                          selected={path === location.pathname}
                        >
                          {path === "/myTasks" && !isFetching ? (
                            <Badge color="info" badgeContent={tasks?.length} max={99}>
                              <ListItemIcon
                                sx={{
                                  minWidth: 0,
                                  justifyContent: "center",
                                }}
                              >
                                {icon}
                              </ListItemIcon>
                            </Badge>
                          ) : (
                            <ListItemIcon
                              sx={{
                                minWidth: 0,
                                justifyContent: "center",
                              }}
                            >
                              {icon}
                            </ListItemIcon>
                          )}
                          <ListItemText
                            primary={description}
                            sx={{
                              ml: open ? 3 : "auto",
                              opacity: open ? 1 : 0,
                              "& .MuiTypography-root": {
                                fontWeight: "500",
                              },
                            }}
                          />
                        </ListItemButton>
                      </StyledTooltipShield>
                    </Link>
                  </ListItem>
                  {divider && <Divider />}
                </Fragment>
              );
            })}
          </Box>
          <Box>
            <ListItem onClick={() => setModalOpen("contactUs", true)} disablePadding sx={{ display: "block" }}>
              <StyledTooltipShield placement="left" title={!open ? "פתיחת פנייה" : ""}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                    color: "text.secondary",
                    m: 1,
                    borderRadius: "10px",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <MessageQuestion color="blue" />
                  </ListItemIcon>
                  <ListItemText
                    primary="פתיחת תמיכה"
                    sx={{
                      opacity: open ? 1 : 0,
                      "& .MuiTypography-root": {
                        fontWeight: "500",
                      },
                    }}
                  />
                </ListItemButton>
              </StyledTooltipShield>
            </ListItem>
          </Box>
        </List>
      </Drawer>
      <Fade in={open} timeout={300}>
        <Box
          onClick={handleDrawerClose}
          sx={{ position: "absolute", width: "100%", height: "-webkit-fill-available", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 4 }}
        />
      </Fade>
    </>
  );
}
