// TODO: thay bằng gọi API thật khi BE xong
// Mock tài khoản người dùng (bảng USER) — dùng chung cho đăng nhập, đăng ký, tạo tài khoản nhân sự và duyệt tài khoản.
// 2 nguồn dữ liệu:
// - SEED: data/users.js — hằng số trong code, id cố định (U001…U016), KHÔNG bao giờ ghi vào localStorage.
// - USER-CREATED (localStorage): chỉ phần phát sinh khi dùng — tài khoản mới (id từ U1000) và bản sửa của tài khoản seed
//   (duyệt/từ chối, khóa, đổi mật khẩu, sửa thông tin). Dữ liệu dùng = SEED hợp nhất USER-CREATED theo id (bản lưu ghi đè).
// - SEED_VERSION (data/seedVersion.js) khác bản đã lưu → xóa toàn bộ USER-CREATED để seed mới nạp lại sạch.
// LƯU Ý: mock lưu cả mật khẩu trong localStorage — chỉ để demo, BE thật không làm vậy.
import users from "../data/users";
import { SEED_VERSION, USER_CREATED_ID_START } from "../data/seedVersion";
import { todayISO } from "../utils/date";

const NETWORK_DELAY_MS = 400;

// Mật khẩu mặc định cho tài khoản nhân sự mới — nhân sự bắt buộc đổi ở lần đăng nhập đầu (mustChangePassword)
export const DEFAULT_STAFF_PASSWORD = "123456";

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STORAGE_KEY = "equitrack.userData"; // USER-CREATED: mảng bản ghi USER (tài khoản mới + bản sửa của seed)
const VERSION_KEY = "equitrack.seedVersion";
const LEGACY_KEY = "equitrack.users"; // bản cũ lưu cả danh sách (lẫn seed) — gây lệch id, bỏ hẳn

const idNumber = (id) => Number(String(id).replace(/\D/g, ""));
const seedById = new Map(users.map((u) => [u.id, u]));

// Đọc USER-CREATED; khác SEED_VERSION (hoặc chưa có) → xóa sạch rồi ghi version mới
function loadUserCreated() {
  try {
    localStorage.removeItem(LEGACY_KEY);
    if (localStorage.getItem(VERSION_KEY) !== String(SEED_VERSION)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
      return [];
    }
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Chỉ nhận bản ghi hợp lệ: sửa của 1 tài khoản seed còn tồn tại, hoặc tài khoản mới có id ≥ 1000
    return Array.isArray(saved)
      ? saved.filter((u) => u?.id && (seedById.has(u.id) || idNumber(u.id) >= USER_CREATED_ID_START))
      : [];
  } catch {
    return [];
  }
}

// Dữ liệu dùng = SEED hợp nhất USER-CREATED theo id (bản lưu ghi đè bản seed cùng id), tài khoản mới nối sau
function mergeUsers() {
  const overrides = new Map(loadUserCreated().map((u) => [u.id, u]));
  const merged = users.map((u) => ({ ...u, ...overrides.get(u.id) }));
  const created = [...overrides.values()].filter((u) => !seedById.has(u.id));
  return [...merged, ...created];
}

const userStore = mergeUsers();

// Gọi sau mỗi thao tác ghi: chỉ lưu tài khoản mới + tài khoản seed đã bị sửa (khác seed), không lưu seed nguyên bản
function saveUsers() {
  const changed = userStore.filter((u) => {
    const seed = seedById.get(u.id);
    return !seed || JSON.stringify(seed) !== JSON.stringify(u);
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(changed));
    localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
  } catch {
    // Trình duyệt chặn localStorage: vẫn chạy được, chỉ mất dữ liệu khi tải lại
  }
}

// Id tài khoản mới: từ U1000 trở lên, không bao giờ trùng id seed
const nextUserId = () => {
  const max = userStore.reduce((m, u) => Math.max(m, idNumber(u.id)), USER_CREATED_ID_START - 1);
  return `U${max + 1}`;
};

// Không bao giờ trả password ra ngoài service
function withoutPassword({ password: _password, ...user }) {
  return user;
}

// --- Hàm đồng bộ cho luồng đăng nhập/đăng ký (AuthContext, form) ---

export function findUserByEmail(email) {
  return userStore.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

// exceptUserId: bỏ qua chính tài khoản đang sửa
export function isEmailTaken(email, exceptUserId = null) {
  const user = findUserByEmail(email);
  return Boolean(user) && user.id !== exceptUserId;
}

export function findUserById(userId) {
  return userStore.find((u) => u.id === userId) ?? null;
}

// Chủ ngựa tự đăng ký → "pending"; nhân sự nội bộ do Quản lý CLB tạo → "approved"
export function addUser({ fullName, email, password, roleId, status, mustChangePassword = false }) {
  const newUser = {
    id: nextUserId(),
    fullName: fullName.trim(),
    email: email.trim(),
    password,
    roleId,
    status,
    isActive: true,
    mustChangePassword,
    createdAt: todayISO(),
  };
  userStore.push(newUser);
  saveUsers();
  return withoutPassword(newUser);
}

// --- Mock API cho trang quản lý ---

export async function getUsers() {
  await delay();
  return userStore.map(withoutPassword);
}

function findUserOrThrow(userId) {
  const user = userStore.find((u) => u.id === userId);
  if (!user) throw new Error("Không tìm thấy tài khoản");
  return user;
}

// Trả về null nếu không tìm thấy
export async function getUserById(userId) {
  await delay();
  const user = userStore.find((u) => u.id === userId);
  return user ? withoutPassword(user) : null;
}

// Duyệt / từ chối tài khoản Chủ ngựa
export async function updateUserStatus(userId, status) {
  await delay();
  const user = findUserOrThrow(userId);
  user.status = status;
  saveUsers();
  return withoutPassword(user);
}

// Tài khoản nhân sự do Quản lý CLB tạo: duyệt sẵn, không qua trang Duyệt tài khoản.
// Gán mật khẩu mặc định + bắt đổi mật khẩu ở lần đăng nhập đầu.
// TODO: BE sinh mật khẩu tạm ngẫu nhiên và gửi email cho nhân sự thay vì dùng mật khẩu cố định
export async function createStaffAccount({ fullName, email, roleId }) {
  await delay();
  return addUser({
    fullName,
    email,
    password: DEFAULT_STAFF_PASSWORD,
    roleId,
    status: "approved",
    mustChangePassword: true,
  });
}

// Đổi mật khẩu (dùng ở màn hình đổi mật khẩu lần đầu) — xong thì bỏ cờ mustChangePassword
export async function changePassword(userId, newPassword) {
  await delay();
  const user = findUserOrThrow(userId);
  user.password = newPassword;
  user.mustChangePassword = false;
  saveUsers();
  return withoutPassword(user);
}

export async function updateStaffAccount(userId, { fullName, email, roleId }) {
  await delay();
  const user = findUserOrThrow(userId);
  Object.assign(user, { fullName: fullName.trim(), email: email.trim(), roleId });
  saveUsers();
  return withoutPassword(user);
}

// Khóa (false) / mở khóa (true) tài khoản
export async function setUserActive(userId, isActive) {
  await delay();
  const user = findUserOrThrow(userId);
  user.isActive = isActive;
  saveUsers();
  return withoutPassword(user);
}
