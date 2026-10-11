// TODO: thay bằng gọi API thật khi BE xong
// Mock API hồ sơ ngựa (bảng HORSE) — dùng chung cho Club Manager (thêm/sửa/xóa) và Head Trainer (xem).
// Dữ liệu giữ trong bộ nhớ của module nên còn nguyên khi chuyển trang, mất khi tải lại trang.
import horses from "../data/horses";
import healthStatuses from "../data/healthStatuses";
import { getUsers } from "./accountService";
import { toUserID } from "../utils/userId";
import { COAT_COLORS, DUPLICATE_HORSE_NAME, HORSE_GENDERS, HORSE_LIMITS, INVALID_BIRTH_DATE } from "../data/horseOptions";
import { getHorseAge, todayISO } from "../utils/date";

const NETWORK_DELAY_MS = 400;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let horseStore = horses.map((h) => ({ ...h }));
const healthStore = healthStatuses.map((h) => ({ ...h }));

const nextHorseId = () => horseStore.reduce((max, h) => Math.max(max, h.HorseID), 0) + 1;

const collapseSpaces = (text) => text.trim().replace(/\s+/g, " ");

// "quarter HORSE" → "Quarter Horse"
const toTitleCase = (text) =>
  collapseSpaces(text)
    .toLocaleLowerCase("vi")
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase("vi") + word.slice(1))
    .join(" ");

// Giống trùng (không phân biệt hoa thường) với giống đã có → dùng đúng cách viết đã có; giống mới → viết hoa chữ cái đầu mỗi từ
function normalizeBreed(breed) {
  const key = collapseSpaces(breed).toLocaleLowerCase("vi");
  return horseStore.find((h) => h.Giong.toLocaleLowerCase("vi") === key)?.Giong ?? toTitleCase(breed);
}

// Tên ngựa không trùng (không phân biệt hoa thường) — BE cũng phải ràng buộc
function assertUniqueName(name, exceptHorseId = null) {
  const key = name.toLocaleLowerCase("vi");
  if (horseStore.some((h) => h.HorseID !== exceptHorseId && h.Ten.toLocaleLowerCase("vi") === key)) {
    throw new Error(DUPLICATE_HORSE_NAME);
  }
}

// Màu lông trùng gợi ý/màu đã có (không phân biệt hoa thường) → dùng đúng cách viết đó; màu mới → viết hoa chữ cái đầu ("nâu đỏ" → "Nâu đỏ")
function normalizeCoatColor(color) {
  const text = collapseSpaces(color);
  const key = text.toLocaleLowerCase("vi");
  const known = [...COAT_COLORS, ...horseStore.map((h) => h.MauLong).filter(Boolean)];
  return known.find((c) => c.toLocaleLowerCase("vi") === key) ?? key.charAt(0).toLocaleUpperCase("vi") + key.slice(1);
}

// Ràng buộc NgaySinh / GioiTinh — BE cũng phải kiểm tra lại
function assertValidProfile(record) {
  const age = getHorseAge(record.NgaySinh);
  if (record.NgaySinh > todayISO() || age === null || age < HORSE_LIMITS.Age.min || age > HORSE_LIMITS.Age.max) {
    throw new Error(INVALID_BIRTH_DATE);
  }
  if (!HORSE_GENDERS.includes(record.GioiTinh)) throw new Error("Giới tính không hợp lệ");
}

// Chuẩn hóa dữ liệu từ form theo kiểu cột trong ERD (tuổi không lưu, tính từ NgaySinh)
function toHorseRecord(data) {
  return {
    Ten: collapseSpaces(data.Ten),
    Giong: normalizeBreed(data.Giong),
    NgaySinh: data.NgaySinh,
    GioiTinh: data.GioiTinh,
    MauLong: normalizeCoatColor(data.MauLong),
    CanNang: Number(data.CanNang),
    DongDoi: collapseSpaces(data.DongDoi),
    OwnerID: Number(data.OwnerID),
    // Ảnh: đường dẫn ảnh có sẵn hoặc data URL vừa chọn ở form; null = dùng placeholder
    photo: data.photo || null,
  };
}

export async function getHorses() {
  await delay();
  return horseStore.map((h) => ({ ...h }));
}

// Trả về null nếu không tìm thấy
export async function getHorseById(horseId) {
  await delay();
  const horse = horseStore.find((h) => h.HorseID === Number(horseId));
  return horse ? { ...horse } : null;
}

export async function createHorse(data) {
  await delay();
  const record = toHorseRecord(data);
  assertUniqueName(record.Ten);
  assertValidProfile(record);
  const newHorse = { HorseID: nextHorseId(), ...record };
  horseStore.push(newHorse);
  return { ...newHorse };
}

export async function updateHorse(horseId, data) {
  await delay();
  const index = horseStore.findIndex((h) => h.HorseID === Number(horseId));
  if (index === -1) throw new Error("Không tìm thấy ngựa");
  const current = horseStore[index];
  const record = toHorseRecord(data);
  assertUniqueName(record.Ten, current.HorseID);
  assertValidProfile(record);
  // Vị trí cắt ảnh chỉ đúng với ảnh cũ — đổi ảnh thì bỏ, quay về mặc định
  const photoPosition = record.photo === current.photo ? current.photoPosition : undefined;
  horseStore[index] = { HorseID: current.HorseID, ...record, ...(photoPosition && { photoPosition }) };
  return { ...horseStore[index] };
}

// Chỉ gọi sau khi đã kiểm tra ngựa không có dữ liệu liên quan — dùng deleteHorseIfUnused (horseUsageService)
export async function deleteHorse(horseId) {
  await delay();
  horseStore = horseStore.filter((h) => h.HorseID !== Number(horseId));
}

// Trạng thái sức khỏe hiện tại (bảng HEALTHSTATUS) — ngựa mới thêm sẽ chưa có bản ghi
export async function getHealthStatuses() {
  await delay();
  return healthStore.map((h) => ({ ...h }));
}

// Chủ ngựa đã được duyệt (USER có roleId "horse_owner") theo field ERD, không kèm mật khẩu.
// Gồm cả tài khoản đã bị khóa (isActive = false) để vẫn hiện tên chủ của ngựa cũ; form chỉ cho chọn tài khoản đang hoạt động.
export async function getHorseOwners() {
  const users = await getUsers();
  return users
    .filter((u) => u.roleId === "horse_owner" && u.status === "approved")
    .map((u) => ({ UserID: toUserID(u.id), HoTen: u.fullName, Email: u.email, isActive: u.isActive }));
}
