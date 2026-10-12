import { createContext, useState } from "react";
import { changePassword as changePasswordApi } from "../services/accountService";
import { ApiError } from "../services/apiClient";
import { clearAuthSession, getStoredAuthUser, loginWithApi, getAccessToken } from "../services/authApi";

export const AuthContext = createContext(null);

// Không bao giờ lưu password vào state
function toSessionUser({ password: _password, ...userWithoutPassword }) {
  return userWithoutPassword;
}

function restoreSession() {
  const user = getStoredAuthUser();
  if (user && getAccessToken()) return toSessionUser(user);
  clearAuthSession();
  return null;
}

export function AuthProvider({ children }) {
  // null = chưa đăng nhập. Không có tài khoản mặc định: chỉ khôi phục phiên đã lưu.
  const [user, setUser] = useState(restoreSession);

  const login = async (email, password) => {
    try {
      const sessionUser = toSessionUser(await loginWithApi(email, password));
      setUser(sessionUser);
      return { user: sessionUser };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "PENDING_APPROVAL") {
          return {
            statusScreen: {
              status: "Chờ duyệt",
              fullName: "",
              email: email.trim(),
            },
          };
        }
        if (err.status === 401) {
          return { error: err.message || "Email hoặc mật khẩu không đúng" };
        }
      }
      return { error: "Không kết nối được máy chủ, vui lòng thử lại." };
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthSession();
  };

  // TODO: thay bằng gọi API thật khi BE xong
  // Đổi mật khẩu cho user đang đăng nhập (màn hình đổi mật khẩu lần đầu) — cập nhật luôn session để gỡ cờ mustChangePassword
  const changePassword = async (newPassword) => {
    const updated = await changePasswordApi(user.id, newPassword);
    setUser(updated);
    return updated;
  };

  return <AuthContext.Provider value={{ user, login, logout, changePassword }}>{children}</AuthContext.Provider>;
}
