// Phiên đăng nhập với BE thật: JWT + user do POST /api/auth/login trả về.
// Lưu localStorage (chung mọi tab cùng origin) — đăng nhập/đăng xuất ở tab khác sẽ đồng bộ khi F5 hoặc qua sự kiện storage.
const API_SESSION_KEY = "equitrack.apiSession";

let unauthorizedHandler = null;

function readRaw(storage) {
  try {
    return storage.getItem(API_SESSION_KEY);
  } catch {
    return null;
  }
}

function writeRaw(value) {
  try {
    if (value == null) localStorage.removeItem(API_SESSION_KEY);
    else localStorage.setItem(API_SESSION_KEY, value);
    // Dọn bản cũ theo tab (sessionStorage) để tránh tab cũ F5 lại phiên lệch
    sessionStorage.removeItem(API_SESSION_KEY);
  } catch {
    // bỏ qua
  }
}

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

function parseSession(raw) {
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session?.token || !session.user) return null;
    if (isTokenExpired(session.token)) return null;
    return session;
  } catch {
    return null;
  }
}

// { token, user } còn hạn; không có / hết hạn → null (và dọn phiên hết hạn)
export function getApiSession() {
  let session = parseSession(readRaw(localStorage));
  if (session) return session;

  // Một lần: nâng phiên cũ từ sessionStorage (theo tab) lên localStorage (chung tab)
  const legacy = parseSession(readRaw(sessionStorage));
  if (legacy) {
    writeRaw(JSON.stringify(legacy));
    return legacy;
  }

  try {
    localStorage.removeItem(API_SESSION_KEY);
    sessionStorage.removeItem(API_SESSION_KEY);
  } catch {
    // bỏ qua
  }
  return null;
}

export function getApiToken() {
  return getApiSession()?.token ?? null;
}

export function saveApiSession(session) {
  writeRaw(JSON.stringify(session));
}

export function clearApiSession() {
  writeRaw(null);
}

export function getApiSessionStorageKey() {
  return API_SESSION_KEY;
}

// AuthContext đăng ký: BE trả 401 với token đang dùng (hết hạn / bị thu hồi) → đăng xuất
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  clearApiSession();
  unauthorizedHandler?.();
}
