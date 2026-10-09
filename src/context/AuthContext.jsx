import { createContext, useState } from "react";
import { changePassword as changePasswordApi, findUserByEmail, findUserByRole } from "../services/accountService";

export const AuthContext = createContext(null);

// Không bao giờ lưu password vào state
function toSessionUser({ password: _password, ...userWithoutPassword }) {
  return userWithoutPassword;
}

export function AuthProvider({ children }) {
  // null = chưa đăng nhập
  const [user, setUser] = useState(null);

  // TODO: thay bằng gọi API thật khi BE xong
  // Thành công → { user }, thất bại → { error } (sai email/mật khẩu, tài khoản chưa được duyệt hoặc đã bị khóa)
  const login = (email, password) => {
    const foundUser = findUserByEmail(email);
    if (!foundUser || foundUser.password !== password) {
      return { error: "Email hoặc mật khẩu không đúng" };
    }
    if (foundUser.status === "pending") {
      return { error: "Tài khoản đang chờ duyệt, vui lòng quay lại sau." };
    }
    if (foundUser.status === "rejected") {
      return { error: "Tài khoản đã bị từ chối, vui lòng liên hệ Quản lý CLB." };
    }
    if (foundUser.isActive === false) {
      return { error: "Tài khoản đã bị khóa, liên hệ Quản lý CLB." };
    }
    const sessionUser = toSessionUser(foundUser);
    setUser(sessionUser);
    return { user: sessionUser };
  };

  const logout = () => {
    setUser(null);
  };

  // TODO: thay bằng gọi API thật khi BE xong
  // Đổi mật khẩu cho user đang đăng nhập (màn hình đổi mật khẩu lần đầu) — cập nhật luôn session để gỡ cờ mustChangePassword
  const changePassword = async (newPassword) => {
    const updated = await changePasswordApi(user.id, newPassword);
    setUser(updated);
    return updated;
  };

  // TODO: thay bằng gọi API thật khi BE xong
  // Đăng nhập giả theo roleId để test UI: "head_trainer", "veterinarian", "groom", "horse_owner", "club_manager"
  const mockLogin = (roleId) => {
    const mockUser = findUserByRole(roleId);
    if (!mockUser) {
      console.warn(`mockLogin: roleId không hợp lệ "${roleId}"`);
      return;
    }
    setUser(toSessionUser(mockUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, mockLogin, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
