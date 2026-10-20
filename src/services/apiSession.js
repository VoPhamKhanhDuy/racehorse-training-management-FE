// Phiên đăng nhập với BE thật: JWT + user do POST /api/auth/login trả về.
// Lưu sessionStorage (giống phiên mock trong AuthContext) để F5 vẫn giữ đăng nhập, đóng tab là hết.
const API_SESSION_KEY = "equitrack.apiSession";

let unauthorizedHandler = null;

// Payload JWT (base64url) → object; hỏng thì null
function decodeTokenPayload(token) {
  try {
    const binary = atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const exp = decodeTokenPayload(token)?.exp;
  return typeof exp === "number" && exp * 1000 <= Date.now();
}

// { token, user } còn hạn; không có / hết hạn → null (và dọn phiên hết hạn)
export function getApiSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(API_SESSION_KEY));
    if (!session?.token || !session.user) return null;
    if (isTokenExpired(session.token)) {
      sessionStorage.removeItem(API_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getApiToken() {
  return getApiSession()?.token ?? null;
}

export function saveApiSession(session) {
  try {
    sessionStorage.setItem(API_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Trình duyệt chặn sessionStorage: vẫn chạy được, chỉ mất phiên khi tải lại
  }
}

export function clearApiSession() {
  try {
    sessionStorage.removeItem(API_SESSION_KEY);
  } catch {
    // bỏ qua
  }
}

// AuthContext đăng ký: BE trả 401 với token đang dùng (hết hạn / bị thu hồi) → đăng xuất
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  clearApiSession();
  unauthorizedHandler?.();
}
