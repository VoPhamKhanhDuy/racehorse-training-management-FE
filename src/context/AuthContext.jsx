import { createContext, useState } from "react";
import users from "../data/users";

export const AuthContext = createContext(null);

// Không bao giờ lưu password vào state
function toSessionUser({ password: _password, ...userWithoutPassword }) {
  return userWithoutPassword;
}

export function AuthProvider({ children }) {
  // null = chưa đăng nhập
  const [user, setUser] = useState(null);

  // TODO: thay bằng gọi API thật khi BE xong
  // Trả về true nếu đăng nhập thành công, false nếu sai email/mật khẩu
  const login = (email, password) => {
    const foundUser = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!foundUser) return false;
    setUser(toSessionUser(foundUser));
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  // TODO: thay bằng gọi API thật khi BE xong
  // Đăng nhập giả theo roleId để test UI: "head_trainer", "veterinarian", "groom", "horse_owner", "club_manager"
  const mockLogin = (roleId) => {
    const mockUser = users.find((u) => u.roleId === roleId);
    if (!mockUser) {
      console.warn(`mockLogin: roleId không hợp lệ "${roleId}"`);
      return;
    }
    setUser(toSessionUser(mockUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, mockLogin }}>
      {children}
    </AuthContext.Provider>
  );
}
