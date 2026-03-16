import { Box } from "@mui/material";
import Unauthorized from "@screens/Unauthorized";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AppWrapper } from "../components";
import { ClassifyTables, ManageUsers, MyTasks, Permissions, PermissionGroups } from "../screens";
import ProtectedRoute from "./ProtectedRoute";
import Domains from "@screens/Domains";
import { SHIELD_ROLE_NAME } from "@port/shield-schemas";
import ManagerMoved from "@screens/ManagerMoved";

export function RouterConfig() {
  return (
    <Router
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route element={<AppWrapper />}>
          <Route
            path="/unauthorized"
            element={
              <Box height="100%" display="flex" justifyContent="center">
                <Unauthorized />
              </Box>
            }
          />
          <Route
            element={
              <ProtectedRoute
                approvedRoles={[
                  SHIELD_ROLE_NAME.support_center,
                  SHIELD_ROLE_NAME.amlach,
                  SHIELD_ROLE_NAME.rav_amlach,
                  SHIELD_ROLE_NAME.api_user,
                ]}
              />
            }
          >
            <Route path="/manageUsers" element={<ManageUsers />} />
          </Route>
          <Route
            element={
              <ProtectedRoute approvedRoles={[SHIELD_ROLE_NAME.amlach, SHIELD_ROLE_NAME.rav_amlach, SHIELD_ROLE_NAME.support_center]} />
            }
          >
            <Route path="/permissionGroups" element={<PermissionGroups />} />
          </Route>
          <Route element={<ProtectedRoute approvedRoles={[SHIELD_ROLE_NAME.amlach, SHIELD_ROLE_NAME.rav_amlach]} />}>
            <Route path="/" element={<MyTasks />} />
            <Route path="/myTasks" element={<MyTasks />} />
            <Route path="/classifyTables" element={<ClassifyTables />} />
          </Route>
          <Route element={<ProtectedRoute approvedRoles={[SHIELD_ROLE_NAME.rav_amlach, SHIELD_ROLE_NAME.amlach]} />}>
            <Route path="/manager" element={<ManagerMoved />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/permissions" element={<Permissions />} />
            <Route path="/domains" element={<Domains />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}
