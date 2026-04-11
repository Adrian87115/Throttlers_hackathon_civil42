import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ user, checkRole }) {
  if (!user) return <Navigate to="/auth" replace />;
  if (checkRole && !checkRole(user)) return <Navigate to="/home" replace />;
  return <Outlet />;
}

export default ProtectedRoute;