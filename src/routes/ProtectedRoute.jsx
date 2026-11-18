import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import roleHomePaths from "./roleHomePaths";

// Chặn truy cập theo role: chưa đăng nhập → /login, chưa đổi mật khẩu mặc định → /change-password,
// sai role → trang chủ của role đó
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // Tài khoản nhân sự mới phải đổi mật khẩu trước khi vào bất kỳ trang nào — không bỏ qua được
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.roleId)) {
    return <Navigate to={roleHomePaths[user.roleId] || "/"} replace />;
  }
  return children;
}
