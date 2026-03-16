import { Outlet, Navigate } from "react-router-dom";
import { useLoggedUserInfo } from "@api/auth";
import { ShieldRoleName } from "@port/shield-schemas";

function ProtectedRoute({ approvedRoles }: { approvedRoles?: ShieldRoleName[] }) {
  const { data: user } = useLoggedUserInfo();

  return user && (user.isAdmin || (approvedRoles && user.roleNames.some((role) => approvedRoles.includes(role)))) ? (
    <Outlet />
  ) : (
    <Navigate to="/unauthorized" />
  );
}

export default ProtectedRoute;
