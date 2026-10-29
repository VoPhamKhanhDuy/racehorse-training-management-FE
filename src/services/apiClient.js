// Gọi BE thật (SWP.API): gắn JWT, đổi lỗi HTTP thành ApiError có message tiếng Việt.
// Lỗi nghiệp vụ của BE có dạng { message, code, details } — code: VALIDATION_ERROR (400), NOT_FOUND (404),
// INVALID_STATUS / CONFLICT (409), HORSE_NOT_FIT (422, details = lý do thể trạng).
import { getApiToken, notifyUnauthorized } from "./apiSession";

// Để trống = gọi cùng origin (/api/...) qua proxy của Vite dev server (vite.config.js)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

const NETWORK_ERROR_MESSAGE = "Không kết nối được máy chủ. Kiểm tra BE (SWP.API) đã chạy chưa.";

const NO_SESSION_MESSAGE = "Chức năng này cần đăng nhập bằng tài khoản trên máy chủ. Vui lòng đăng nhập lại.";

const DEFAULT_MESSAGES = {
  401: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
  403: "Tài khoản của bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu.",
};

// Token đăng nhập kiểu cũ (authApi.js, sessionStorage) — vẫn được đọc để các hàm của authApi hoạt động
const TOKEN_KEY = "equitrack.accessToken";

export function getAccessToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // bỏ qua
  }
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, details = [] } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildUrl(path, query) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.append(key, value);
  });
  const queryString = params.toString();
  // Chấp nhận cả "/horses" lẫn "/api/horses"
  const apiPath = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? path : `/${path}`}`;
  return `${API_BASE_URL}${apiPath}${queryString ? `?${queryString}` : ""}`;
}

function messageFromBody(body, status) {
  if (body?.message) return body.message;
  // ProblemDetails của ASP.NET (thiếu trường / sai kiểu): gom các lỗi trong errors thành 1 câu
  const fieldErrors = body?.errors ? Object.values(body.errors).flat() : [];
  if (fieldErrors.length > 0) return fieldErrors.join(" ");
  if (body?.title) return body.title;
  if (DEFAULT_MESSAGES[status]) return DEFAULT_MESSAGES[status];
  // Proxy của Vite trả 5xx rỗng khi BE chưa chạy
  return status >= 500 && !body ? NETWORK_ERROR_MESSAGE : `Máy chủ báo lỗi (HTTP ${status}), vui lòng thử lại.`;
}

// auth = true mà chưa có token → báo ngay, không gửi request
function authHeaders(headers, auth) {
  if (!auth) return headers;
  const token = getApiToken() ?? getAccessToken();
  if (!token) throw new ApiError(NO_SESSION_MESSAGE, { status: 401, code: "NO_API_SESSION" });
  return { ...headers, Authorization: `Bearer ${token}` };
}

async function send(url, init, auth) {
  let response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, { code: "NETWORK_ERROR" });
  }

  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Token bị BE từ chối (hết hạn / sai khóa) → đăng xuất về trang Đăng nhập
    if (response.status === 401 && auth) notifyUnauthorized();
    throw new ApiError(messageFromBody(data, response.status), {
      status: response.status,
      code: data?.code ?? null,
      details: Array.isArray(data?.details) ? data.details : [],
    });
  }
  return data;
}

// auth = false: API công khai (đăng nhập, đăng ký).
export async function apiRequest(path, { method = "GET", query, body, auth = true } = {}) {
  let headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  headers = authHeaders(headers, auth);

  return send(
    buildUrl(path, query),
    { method, headers, body: body === undefined ? undefined : JSON.stringify(body) },
    auth,
  );
}

/** POST multipart (không set Content-Type — trình duyệt tự thêm boundary). */
export async function apiUploadForm(path, formData, { auth = true } = {}) {
  const headers = authHeaders({ Accept: "application/json" }, auth);
  return send(buildUrl(path), { method: "POST", headers, body: formData }, auth);
}
