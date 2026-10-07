// TODO: thay bằng gọi API thật khi BE xong
// Mock API cho Head Trainer: đọc/ghi mock data trong src/data/ (field theo ERD), có delay giả lập mạng.
// Các trang chỉ gọi qua các hàm này, nên khi có BE chỉ cần sửa file này.
import trainingPlans from "../data/trainingPlans";
import trainingSchedules from "../data/trainingSchedules";
import trainingSessions from "../data/trainingSessions";
import users from "../data/users";
import { toUserID } from "../utils/userId";
import { getHealthStatuses, getHorses } from "./horseService";

// Ngựa + trạng thái sức khỏe dùng chung kho với trang Quản lý hồ sơ ngựa (Club Manager)
export { getHealthStatuses, getHorses };

const NETWORK_DELAY_MS = 400;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Bản sao trong bộ nhớ — thêm mới sẽ mất khi tải lại trang (giống chưa có DB)
const db = {
  trainingPlans: trainingPlans.map((p) => ({ ...p })),
  trainingSchedules: trainingSchedules.map((s) => ({ ...s })),
  trainingSessions: trainingSessions.map((s) => ({ ...s })),
};

// Trả bản sao để component không sửa trực tiếp vào "DB"
const clone = (list) => list.map((item) => ({ ...item }));

// Id số tự tăng, giống cột int PK trong ERD
const nextId = (list, key) => list.reduce((max, item) => Math.max(max, item[key]), 0) + 1;

// Danh sách user theo field ERD (UserID, HoTen), không kèm mật khẩu — dùng để hiện tên người tạo/thực hiện
export async function getUsers() {
  await delay();
  return users.map((u) => ({ UserID: toUserID(u.id), HoTen: u.fullName, Email: u.email, roleId: u.roleId }));
}

export async function getTrainingPlans(horseId) {
  await delay();
  const plans = horseId ? db.trainingPlans.filter((p) => p.HorseID === Number(horseId)) : db.trainingPlans;
  return clone(plans).sort((a, b) => b.PlanID - a.PlanID);
}

export async function createTrainingPlan(data) {
  await delay();
  const newPlan = {
    PlanID: nextId(db.trainingPlans, "PlanID"),
    HorseID: Number(data.HorseID),
    CuLy: Number(data.CuLy),
    KhoiLuong: Number(data.KhoiLuong),
    MatSan: data.MatSan,
    GiaiDoan: data.GiaiDoan,
    CreatedBy: Number(data.CreatedBy),
  };
  db.trainingPlans.push(newPlan);
  return { ...newPlan };
}

export async function getSchedules(date) {
  await delay();
  const items = date ? db.trainingSchedules.filter((s) => s.Ngay === date) : db.trainingSchedules;
  return clone(items).sort((a, b) => a.Ngay.localeCompare(b.Ngay) || a.Gio.localeCompare(b.Gio));
}

export async function getTrainingSessions(horseId) {
  await delay();
  const sessions = horseId
    ? db.trainingSessions.filter((s) => s.HorseID === Number(horseId))
    : db.trainingSessions;
  return clone(sessions).sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.SessionID - a.SessionID);
}

export async function addTrainingSession(data) {
  await delay();
  const newSession = {
    SessionID: nextId(db.trainingSessions, "SessionID"),
    HorseID: Number(data.HorseID),
    NhipTim: Number(data.NhipTim),
    VanToc: Number(data.VanToc),
    ChiSoTap: data.ChiSoTap,
    NhanXet: data.NhanXet,
    Ngay: data.Ngay,
  };
  db.trainingSessions.push(newSession);
  return { ...newSession };
}
