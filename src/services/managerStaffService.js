import { apiRequest } from "./apiClient";

export const DEFAULT_STAFF_PASSWORD = "123456";

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function mapStaff(raw) {
  if (!raw) return null;
  const userId = Number(pick(raw, "userID", "UserID", "userId", "UserId"));
  return {
    id: userId,
    fullName: pick(raw, "fullName", "FullName") ?? "",
    email: pick(raw, "email", "Email") ?? "",
    roleId: pick(raw, "roleId", "RoleId") ?? "",
    status: "approved",
    isActive: Boolean(pick(raw, "isActive", "IsActive")),
    mustChangePassword: Boolean(pick(raw, "mustChangePassword", "MustChangePassword")),
    createdAt: pick(raw, "createdAt", "CreatedAt") ?? null,
  };
}

export async function getStaffAccounts() {
  const data = await apiRequest("/manager/staff");
  return (data ?? []).map(mapStaff).filter(Boolean);
}

export async function getStaffAccountById(userId) {
  try {
    const raw = await apiRequest(`/manager/staff/${Number(userId)}`);
    return mapStaff(raw);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function createStaffAccount({ fullName, email, roleId }) {
  const raw = await apiRequest("/manager/staff", {
    method: "POST",
    body: { fullName, email, roleId },
  });
  return mapStaff(raw);
}

export async function updateStaffAccount(userId, { fullName, email, roleId }) {
  const raw = await apiRequest(`/manager/staff/${Number(userId)}`, {
    method: "PUT",
    body: { fullName, email, roleId },
  });
  return mapStaff(raw);
}

export async function setStaffActive(userId, isActive) {
  const raw = await apiRequest(`/manager/staff/${Number(userId)}/active`, {
    method: "PATCH",
    body: { isActive },
  });
  return mapStaff(raw);
}

export async function changePasswordApi(newPassword) {
  const data = await apiRequest("/auth/change-password", {
    method: "POST",
    body: { newPassword },
  });
  return data;
}
