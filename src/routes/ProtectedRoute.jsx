import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

// Chặn truy cập theo role: chưa đăng nhập → /login, sai role → trang chủ
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (allowedRoles && !allowedRoles.includes(user.roleId)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
