import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import roleHomePaths from "./roleHomePaths";

// Chặn truy cập theo role: chưa đăng nhập → /login, sai role → trang chủ của role đó
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (allowedRoles && !allowedRoles.includes(user.roleId)) {
    return <Navigate to={roleHomePaths[user.roleId] || "/"} replace />;
  }
  return children;
}
