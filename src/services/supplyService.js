// Flow 4 gọi API /api/supplies. Nhân viên chăm sóc chỉ xem; Quản lý CLB thêm, sửa, nhập và xuất kho.
import { apiRequest } from "./apiClient";

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function mapSupply(raw) {
  return {
    SupplyID: Number(pick(raw, "supplyID", "SupplyID")),
    TenVatTu: pick(raw, "tenVatTu", "TenVatTu") ?? "",
    Loai: pick(raw, "loai", "Loai") ?? "",
    SoLuongTon: Number(pick(raw, "soLuongTon", "SoLuongTon") ?? 0),
    ManagedBy: Number(pick(raw, "managedBy", "ManagedBy") ?? 0),
    DonGia: Number(pick(raw, "donGia", "DonGia") ?? 0),
    DonVi: pick(raw, "donVi", "DonVi") ?? "",
  };
}

function mapStaff(raw) {
  return {
    UserID: Number(pick(raw, "userID", "UserID")),
    HoTen: pick(raw, "hoTen", "HoTen") ?? "",
    roleId: pick(raw, "roleId", "RoleId") ?? "",
    isActive: Boolean(pick(raw, "isActive", "IsActive")),
  };
}

function toSupplyBody(data) {
  return {
    tenVatTu: data.TenVatTu.trim(),
    loai: data.Loai.trim(),
    soLuongTon: Number(data.SoLuongTon),
    donGia: Number(data.DonGia),
    managedBy: Number(data.ManagedBy),
  };
}

export async function getSupplies() {
  const rows = await apiRequest("/supplies");
  return (rows ?? []).map(mapSupply);
}

export async function getSupplyById(supplyId) {
  try {
    const raw = await apiRequest(`/supplies/${Number(supplyId)}`);
    return raw ? mapSupply(raw) : null;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function createSupply(data) {
  const saved = await apiRequest("/supplies", { method: "POST", body: toSupplyBody(data) });
  return mapSupply(saved);
}

export async function updateSupply(supplyId, data) {
  const saved = await apiRequest(`/supplies/${Number(supplyId)}`, { method: "PUT", body: toSupplyBody(data) });
  return mapSupply(saved);
}

export async function deleteSupply(supplyId) {
  await apiRequest(`/supplies/${Number(supplyId)}`, { method: "DELETE" });
}

export async function adjustStock(supplyId, delta) {
  const saved = await apiRequest(`/supplies/${Number(supplyId)}/adjust`, {
    method: "POST",
    body: { delta: Number(delta) },
  });
  return mapSupply(saved);
}

export async function getStaffMembers() {
  const rows = await apiRequest("/supplies/staff");
  return (rows ?? []).map(mapStaff);
}
