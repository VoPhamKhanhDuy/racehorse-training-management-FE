// TODO: thay bằng gọi API thật khi BE xong
// Mock API hồ sơ ngựa (bảng HORSE) — dùng chung cho Club Manager (thêm/sửa/xóa) và Head Trainer (xem).
// Dữ liệu giữ trong bộ nhớ của module nên còn nguyên khi chuyển trang, mất khi tải lại trang.
import horses from "../data/horses";
import healthStatuses from "../data/healthStatuses";
import { getUsers } from "./accountService";
import { toUserID } from "../utils/userId";

const NETWORK_DELAY_MS = 400;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let horseStore = horses.map((h) => ({ ...h }));
const healthStore = healthStatuses.map((h) => ({ ...h }));

const nextHorseId = () => horseStore.reduce((max, h) => Math.max(max, h.HorseID), 0) + 1;

// Chuẩn hóa dữ liệu từ form theo kiểu cột trong ERD
function toHorseRecord(data) {
  return {
    Ten: data.Ten.trim(),
    Giong: data.Giong.trim(),
    Tuoi: Number(data.Tuoi),
    CanNang: Number(data.CanNang),
    DongDoi: data.DongDoi.trim(),
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
  const newHorse = { HorseID: nextHorseId(), ...toHorseRecord(data) };
  horseStore.push(newHorse);
  return { ...newHorse };
}

export async function updateHorse(horseId, data) {
  await delay();
  const index = horseStore.findIndex((h) => h.HorseID === Number(horseId));
  if (index === -1) throw new Error("Không tìm thấy ngựa");
  const current = horseStore[index];
  const record = toHorseRecord(data);
  // Vị trí cắt ảnh chỉ đúng với ảnh cũ — đổi ảnh thì bỏ, quay về mặc định
  const photoPosition = record.photo === current.photo ? current.photoPosition : undefined;
  horseStore[index] = { HorseID: current.HorseID, ...record, ...(photoPosition && { photoPosition }) };
  return { ...horseStore[index] };
}

export async function deleteHorse(horseId) {
  await delay();
  horseStore = horseStore.filter((h) => h.HorseID !== Number(horseId));
}

// Trạng thái sức khỏe hiện tại (bảng HEALTHSTATUS) — ngựa mới thêm sẽ chưa có bản ghi
export async function getHealthStatuses() {
  await delay();
  return healthStore.map((h) => ({ ...h }));
}

// Chủ ngựa đã được duyệt (USER có roleId "horse_owner") theo field ERD, không kèm mật khẩu
export async function getHorseOwners() {
  const users = await getUsers();
  return users
    .filter((u) => u.roleId === "horse_owner" && u.status === "approved")
    .map((u) => ({ UserID: toUserID(u.id), HoTen: u.fullName, Email: u.email }));
}
