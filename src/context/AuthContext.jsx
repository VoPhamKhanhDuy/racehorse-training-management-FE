import { createContext, useState } from "react";
import { changePassword as changePasswordApi, findUserByEmail, findUserById } from "../services/accountService";

export const AuthContext = createContext(null);

// Phiên đăng nhập: chỉ lưu user id vào sessionStorage (không lưu mật khẩu/role) để F5 / hot reload vẫn giữ đúng tài khoản.
// Khi khởi động: tra id trong dữ liệu USER đã hợp nhất (seed + user-created, xem accountService). Không có user mặc định.
// TODO: khi có BE thì thay bằng token do BE cấp
const SESSION_KEY = "equitrack.sessionUserId";

// Không bao giờ lưu password vào state
function toSessionUser({ password: _password, ...userWithoutPassword }) {
  return userWithoutPassword;
}

function saveSession(user) {
  try {
    sessionStorage.setItem(SESSION_KEY, user.id);
  } catch {
    // Trình duyệt chặn sessionStorage: vẫn đăng nhập được, chỉ mất phiên khi tải lại
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("equitrack.session"); // phiên kiểu cũ (localStorage) — dọn đi
  } catch {
    // bỏ qua
  }
}

// Khôi phục phiên — chỉ khi id còn tồn tại, tài khoản đã duyệt và chưa bị khóa; không thì xóa phiên
// (user = null → ProtectedRoute đưa về /login)
function restoreSession() {
  try {
    const found = findUserById(sessionStorage.getItem(SESSION_KEY));
    if (found && found.status === "approved" && found.isActive !== false) return toSessionUser(found);
  } catch {
    // dữ liệu hỏng → coi như chưa đăng nhập
  }
  clearSession();
  return null;
}

export function AuthProvider({ children }) {
  // null = chưa đăng nhập. Không có tài khoản mặc định: chỉ khôi phục phiên đã lưu.
  const [user, setUser] = useState(restoreSession);

  // TODO: thay bằng gọi API thật khi BE xong
  // Thành công → { user }. Sai email/mật khẩu → { error } (không nói gì về trạng thái).
  // Đúng mật khẩu nhưng chờ duyệt / bị từ chối → { statusScreen: { status, fullName, email } }: KHÔNG tạo phiên đăng nhập,
  // trang Đăng nhập chuyển sang màn trạng thái. Bị khóa → { error, accountStatus } (lỗi inline, cụm "bị khóa" tô màu).
  const login = (email, password) => {
    const foundUser = findUserByEmail(email);
    if (!foundUser || foundUser.password !== password) {
      return { error: "Email hoặc mật khẩu không đúng" };
    }
    if (foundUser.status === "pending" || foundUser.status === "rejected") {
      return {
        statusScreen: {
          status: foundUser.status === "pending" ? "Chờ duyệt" : "Từ chối",
          fullName: foundUser.fullName,
          email: foundUser.email,
        },
      };
    }
    if (foundUser.isActive === false) {
      return { error: "Tài khoản đã bị khóa, liên hệ Quản lý CLB.", accountStatus: { status: "Bị khóa", phrase: "bị khóa" } };
    }
    const sessionUser = toSessionUser(foundUser);
    setUser(sessionUser);
    saveSession(sessionUser);
    return { user: sessionUser };
  };

  const logout = () => {
    setUser(null);
    clearSession();
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
