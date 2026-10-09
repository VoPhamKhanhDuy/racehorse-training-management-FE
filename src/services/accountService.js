// TODO: thay bằng gọi API thật khi BE xong
// Mock tài khoản người dùng (bảng USER) — dùng chung cho đăng nhập, đăng ký, tạo tài khoản nhân sự và duyệt tài khoản.
// Dữ liệu giữ trong bộ nhớ của module nên còn nguyên khi chuyển trang, mất khi tải lại trang.
import users from "../data/users";
import { todayISO } from "../utils/date";

const NETWORK_DELAY_MS = 400;

// Mật khẩu mặc định cho tài khoản nhân sự mới — nhân sự bắt buộc đổi ở lần đăng nhập đầu (mustChangePassword)
export const DEFAULT_STAFF_PASSWORD = "123456";

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const userStore = users.map((u) => ({ ...u }));

const nextUserId = () => {
  const max = userStore.reduce((m, u) => Math.max(m, Number(u.id.replace(/\D/g, ""))), 0);
  return `U${String(max + 1).padStart(3, "0")}`;
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

export function findUserByRole(roleId) {
  return userStore.find((u) => u.roleId === roleId && u.status === "approved" && u.isActive) ?? null;
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
  return withoutPassword(user);
}

export async function updateStaffAccount(userId, { fullName, email, roleId }) {
  await delay();
  const user = findUserOrThrow(userId);
  Object.assign(user, { fullName: fullName.trim(), email: email.trim(), roleId });
  return withoutPassword(user);
}

// Khóa (false) / mở khóa (true) tài khoản
export async function setUserActive(userId, isActive) {
  await delay();
  const user = findUserOrThrow(userId);
  user.isActive = isActive;
  return withoutPassword(user);
}
