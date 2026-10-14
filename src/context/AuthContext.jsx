import { createContext, useEffect, useState } from "react";
import { changePassword as changePasswordApi, findUserByEmail, findUserById } from "../services/accountService";
import { apiRequest } from "../services/apiClient";
import { clearApiSession, getApiSession, saveApiSession, setUnauthorizedHandler } from "../services/apiSession";

export const AuthContext = createContext(null);

// Hai loại phiên đăng nhập:
// - Phiên BE (services/apiSession.js): đăng nhập qua POST /api/auth/login, có JWT — các màn đã nối API thật
//   (giáo án, lịch tập, buổi tập của HLV; lịch được giao của nhân viên chăm sóc) cần phiên này.
// - Phiên mock: chỉ lưu user id vào sessionStorage (không lưu mật khẩu/role) để F5 / hot reload vẫn giữ đúng tài khoản.
//   Dùng khi BE chưa chạy hoặc tài khoản chỉ có trong mock (data/users.js) — các màn còn đọc mock vẫn chạy như cũ.
const SESSION_KEY = "equitrack.sessionUserId";

// Không bao giờ lưu password vào state
function toSessionUser({ password: _password, ...userWithoutPassword }) {
  return userWithoutPassword;
}

// User BE → cùng dạng user mock. Email trùng tài khoản mock thì giữ id mock ("U001"…) để các màn còn đọc mock
// (lọc theo user.id) vẫn nhận ra người này; apiUserId là UserID thật trong DB.
function toApiSessionUser(apiUser) {
  const mockUser = findUserByEmail(apiUser.email);
  return {
    id: mockUser?.id ?? `API${apiUser.userId}`,
    apiUserId: apiUser.userId,
    fullName: apiUser.fullName,
    email: apiUser.email,
    roleId: apiUser.roleId,
    status: "approved",
    isActive: true,
    mustChangePassword: false,
  };
}

function saveSession(user) {
  try {
    sessionStorage.setItem(SESSION_KEY, user.id);
  } catch {
    // Trình duyệt chặn sessionStorage: vẫn đăng nhập được, chỉ mất phiên khi tải lại
  }
}

function clearSession() {
  clearApiSession();
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("equitrack.session"); // phiên kiểu cũ (localStorage) — dọn đi
  } catch {
    // bỏ qua
  }
}

// Khôi phục phiên: ưu tiên phiên BE còn hạn; không có thì phiên mock — chỉ khi id còn tồn tại, tài khoản đã duyệt
// và chưa bị khóa; không thì xóa phiên (user = null → ProtectedRoute đưa về /login)
function restoreSession() {
  const apiSession = getApiSession();
  if (apiSession) return apiSession.user;
  try {
    const found = findUserById(sessionStorage.getItem(SESSION_KEY));
    if (found && found.status === "approved" && found.isActive !== false) return toSessionUser(found);
  } catch {
    // dữ liệu hỏng → coi như chưa đăng nhập
  }
  clearSession();
  return null;
}

// Đăng nhập bằng tài khoản mock (data/users.js + tài khoản tạo khi dùng app)
function loginWithMock(email, password) {
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
  return { user: toSessionUser(foundUser) };
}

export function AuthProvider({ children }) {
  // null = chưa đăng nhập. Không có tài khoản mặc định: chỉ khôi phục phiên đã lưu.
  const [user, setUser] = useState(restoreSession);

  // BE từ chối token (hết hạn) khi đang dùng → đăng xuất, ProtectedRoute đưa về /login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Thành công → { user }. Sai email/mật khẩu → { error } (không nói gì về trạng thái).
  // Đúng mật khẩu nhưng chờ duyệt / bị từ chối → { statusScreen: { status, fullName, email } }: KHÔNG tạo phiên đăng nhập,
  // trang Đăng nhập chuyển sang màn trạng thái. Bị khóa → { error, accountStatus } (lỗi inline, cụm "bị khóa" tô màu).
  // Thử BE trước; BE chưa chạy hoặc không nhận tài khoản thì thử tài khoản mock.
  const login = async (email, password) => {
    let beUnreachable = false;
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
        auth: false,
      });
      const sessionUser = toApiSessionUser(data.user);
      clearSession();
      saveApiSession({ token: data.token, user: sessionUser });
      setUser(sessionUser);
      return { user: sessionUser };
    } catch (err) {
      if (err.code === "PENDING_APPROVAL") {
        return {
          statusScreen: { status: "Chờ duyệt", fullName: findUserByEmail(email)?.fullName ?? "", email: email.trim() },
        };
      }
      beUnreachable = err.code === "NETWORK_ERROR" || err.status >= 500;
    }

    const result = loginWithMock(email, password);
    if (result.user) {
      clearSession();
      setUser(result.user);
      saveSession(result.user);
    } else if (result.error && beUnreachable && !findUserByEmail(email)) {
      // Tài khoản không có trong mock và BE không phản hồi: báo đúng nguyên nhân thay vì "sai mật khẩu"
      return { error: "Không kết nối được máy chủ để đăng nhập. Kiểm tra BE (SWP.API) đã chạy chưa." };
    }
    return result;
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
