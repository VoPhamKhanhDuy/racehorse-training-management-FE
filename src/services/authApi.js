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
    status: "pending",
    createdAt,
  };
}

export async function fetchPendingApprovals() {
  const list = await apiRequest("/manager/account-approvals/pending");
  return (list ?? []).map(mapPendingUser);
}

export async function approveAccountApi(userId) {
  await apiRequest(`/manager/account-approvals/${userId}/approve`, { method: "POST" });
}
