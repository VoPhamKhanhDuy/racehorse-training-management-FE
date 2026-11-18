import { apiRequest, getAccessToken, setAccessToken } from "./apiClient";

export { getAccessToken };

const USER_KEY = "equitrack.authUser";

export function getStoredAuthUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  setAccessToken(null);
  try {
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("equitrack.sessionUserId");
  } catch {
    // bỏ qua
  }
}

function persistAuthSession(token, user) {
  setAccessToken(token);
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem("equitrack.sessionUserId", user.id);
  } catch {
    // bỏ qua
  }
}

/** Khớp shape useAuth / ProtectedRoute (id dạng U123). */
export function mapAuthUser(dto) {
  const userId = dto.userId ?? dto.UserId;
  return {
    id: `U${userId}`,
    fullName: dto.fullName ?? dto.FullName,
    email: dto.email ?? dto.Email,
    roleId: dto.roleId ?? dto.RoleId,
    status: "approved",
    isActive: true,
    mustChangePassword: false,
  };
}

export async function loginWithApi(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { email: email.trim(), password },
    auth: false,
  });
  const token = data.token ?? data.Token;
  const user = mapAuthUser(data.user ?? data.User);
  persistAuthSession(token, user);
  return user;
}

export async function registerWithApi({ fullName, email, password }) {
  await apiRequest("/auth/register", {
    method: "POST",
    body: { fullName: fullName.trim(), email: email.trim(), password },
    auth: false,
  });
}

/** Map Status BE → status FE: Pending→pending, Active→approved, Rejected→rejected. */
export function mapApprovalStatus(raw) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "pending") return "pending";
  if (value === "rejected") return "rejected";
  if (value === "active") return "approved";
  return value || "pending";
}

export function mapPendingUser(dto) {
  const userId = dto.userId ?? dto.UserId;
  const created = dto.createdAt ?? dto.CreatedAt;
  let createdAt = typeof created === "string" ? created.slice(0, 10) : "";
  if (!createdAt && created) {
    createdAt = new Date(created).toISOString().slice(0, 10);
  }
  return {
    id: `U${userId}`,
    userId: Number(userId),
    fullName: dto.fullName ?? dto.FullName,
    email: dto.email ?? dto.Email,
    roleId: dto.roleId ?? dto.RoleId ?? "horse_owner",
    status: mapApprovalStatus(dto.status ?? dto.Status),
    createdAt,
  };
}

export async function fetchPendingApprovals() {
  const list = await apiRequest("/manager/account-approvals/pending");
  return (list ?? []).map(mapPendingUser);
}

/** Toàn bộ chủ ngựa (mọi trạng thái) — tab Tất cả / Đã duyệt / Đã từ chối. */
export async function fetchOwnerApprovals() {
  const list = await apiRequest("/manager/account-approvals");
  return (list ?? []).map(mapPendingUser);
}

export async function approveAccountApi(userId) {
  const data = await apiRequest(`/manager/account-approvals/${userId}/approve`, { method: "POST" });
  return data ? mapPendingUser(data) : null;
}

export async function rejectAccountApi(userId) {
  const data = await apiRequest(`/manager/account-approvals/${userId}/reject`, { method: "POST" });
  return data ? mapPendingUser(data) : null;
}
