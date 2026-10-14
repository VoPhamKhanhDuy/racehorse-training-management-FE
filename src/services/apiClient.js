// Gọi BE thật (SWP.API): gắn JWT, đổi lỗi HTTP thành ApiError có message tiếng Việt.
// Lỗi nghiệp vụ của BE có dạng { message, code, details } — code: VALIDATION_ERROR (400), NOT_FOUND (404),
// INVALID_STATUS / CONFLICT (409), HORSE_NOT_FIT (422, details = lý do thể trạng).
import { getApiToken, notifyUnauthorized } from "./apiSession";

// Để trống = gọi cùng origin (/api/...) qua proxy của Vite dev server (vite.config.js)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

const NETWORK_ERROR_MESSAGE = "Không kết nối được máy chủ. Kiểm tra BE (SWP.API) đã chạy chưa.";

const DEFAULT_MESSAGES = {
  401: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
  403: "Tài khoản của bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu.",
};

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
  return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;
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

// auth = false: API công khai (đăng nhập). auth = true mà chưa có token → báo ngay, không gửi request.
export async function apiRequest(path, { method = "GET", query, body, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getApiToken();
    if (!token) {
      throw new ApiError("Chức năng này cần đăng nhập bằng tài khoản trên máy chủ. Vui lòng đăng nhập lại.", {
        status: 401,
        code: "NO_API_SESSION",
      });
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
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
