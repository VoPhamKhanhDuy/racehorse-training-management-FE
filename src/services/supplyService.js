// TODO: thay bằng gọi API thật khi BE xong
// Mock API vật tư (bảng SUPPLY) cho Club Manager: thêm/sửa/xóa, nhập kho/xuất kho.
// Dữ liệu giữ trong bộ nhớ của module nên còn nguyên khi chuyển trang, mất khi tải lại trang.
import supplies from "../data/supplies";
import { STAFF_ROLE_IDS } from "../data/roles";
import { getUsers } from "./accountService";
import { toUserID } from "../utils/userId";

const NETWORK_DELAY_MS = 400;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let supplyStore = supplies.map((s) => ({ ...s }));

const nextSupplyId = () => supplyStore.reduce((max, s) => Math.max(max, s.SupplyID), 0) + 1;

// Chuẩn hóa dữ liệu từ form theo kiểu cột trong ERD
function toSupplyRecord(data) {
  return {
    TenVatTu: data.TenVatTu.trim(),
    Loai: data.Loai.trim(),
    SoLuongTon: Number(data.SoLuongTon),
    ManagedBy: Number(data.ManagedBy),
    DonGia: Number(data.DonGia),
  };
}

function findSupplyOrThrow(supplyId) {
  const supply = supplyStore.find((s) => s.SupplyID === Number(supplyId));
  if (!supply) throw new Error("Không tìm thấy vật tư");
  return supply;
}

export async function getSupplies() {
  await delay();
  return supplyStore.map((s) => ({ ...s }));
}

// Trả về null nếu không tìm thấy
export async function getSupplyById(supplyId) {
  await delay();
  const supply = supplyStore.find((s) => s.SupplyID === Number(supplyId));
  return supply ? { ...supply } : null;
}

export async function createSupply(data) {
  await delay();
  const newSupply = { SupplyID: nextSupplyId(), ...toSupplyRecord(data) };
  supplyStore.push(newSupply);
  return { ...newSupply };
}

export async function updateSupply(supplyId, data) {
  await delay();
  const supply = findSupplyOrThrow(supplyId);
  Object.assign(supply, toSupplyRecord(data));
  return { ...supply };
}

export async function deleteSupply(supplyId) {
  await delay();
  supplyStore = supplyStore.filter((s) => s.SupplyID !== Number(supplyId));
}

// Nhập kho (delta > 0) / xuất kho (delta < 0). Không cho tồn kho âm.
export async function adjustStock(supplyId, delta) {
  await delay();
  const supply = findSupplyOrThrow(supplyId);
  const newQuantity = supply.SoLuongTon + delta;
  if (newQuantity < 0) throw new Error(`Chỉ còn ${supply.SoLuongTon} trong kho, không thể xuất ${-delta}`);
  supply.SoLuongTon = newQuantity;
  return { ...supply };
}

// Toàn bộ nhân sự nội bộ theo field ERD (kể cả đã khóa, để vẫn hiện tên người quản lý cũ).
// Form chỉ cho chọn người đang hoạt động (isActive).
export async function getStaffMembers() {
  const users = await getUsers();
  return users
    .filter((u) => STAFF_ROLE_IDS.includes(u.roleId))
    .map((u) => ({ UserID: toUserID(u.id), HoTen: u.fullName, roleId: u.roleId, isActive: u.isActive }));
}
