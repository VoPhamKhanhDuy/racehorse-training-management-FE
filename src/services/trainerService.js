// TODO: thay bằng gọi API thật khi BE xong
// Mock API cho Head Trainer: đọc/ghi mock data trong src/data/ (field theo ERD), có delay giả lập mạng.
// Các trang chỉ gọi qua các hàm này, nên khi có BE chỉ cần sửa file này.
import trainingPlans from "../data/trainingPlans";
import trainingSchedules from "../data/trainingSchedules";
import trainingSessions from "../data/trainingSessions";
import users from "../data/users";
import { toUserID } from "../utils/userId";
import { formatDate, todayISO } from "../utils/date";
import { getUsers as getAccountUsers } from "./accountService";
import { createPersistedList } from "./persistedStore";
import { SESSION_LIMITS } from "../data/trainingSessionOptions";
import { getHealthStatuses, getHorseById, getHorses } from "./horseService";
import { getActiveTrainingLocks as getActiveLocks, getLatestExamDate, getVaccinations, isHorseLocked } from "./vetService";
export {
  cancelRaceRegistration,
  dismissPrizeAlert,
  getPrizeAlerts,
  getRaceRegistrations,
  getRaces,
  registerHorseForRace,
  setRaceRegistrationPrize,
  updateRaceResult,
} from "./raceService";

// Ngựa + trạng thái sức khỏe dùng chung kho với trang Quản lý hồ sơ ngựa (Club Manager)
export { getHealthStatuses, getHorseById, getHorses };

const NETWORK_DELAY_MS = 400;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Bản sao trong bộ nhớ — thêm mới sẽ mất khi tải lại trang (giống chưa có DB)
// Lưu bền: SEED + lớp thay đổi trong localStorage (services/persistedStore.js)
const planList = createPersistedList("trainingPlans", trainingPlans, "PlanID");
const scheduleList = createPersistedList("trainingSchedules", trainingSchedules, "ScheduleID");
const sessionList = createPersistedList("trainingSessions", trainingSessions, "SessionID");
const db = {
  trainingPlans: planList.items,
  trainingSchedules: scheduleList.items,
  trainingSessions: sessionList.items,
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

// Chuẩn hóa dữ liệu từ form theo kiểu cột trong ERD
function toPlanRecord(data) {
  return {
    HorseID: Number(data.HorseID),
    CuLy: Number(data.CuLy),
    KhoiLuong: Number(data.KhoiLuong),
    MatSan: data.MatSan,
    GiaiDoan: data.GiaiDoan,
  };
}

// Mỗi ngựa tối đa 1 giáo án cho mỗi giai đoạn (HorseID + GiaiDoan duy nhất) — BE cũng phải ràng buộc UNIQUE
function assertUniquePhase(record, exceptPlanId = null) {
  const duplicate = db.trainingPlans.some(
    (p) => p.HorseID === record.HorseID && p.GiaiDoan === record.GiaiDoan && p.PlanID !== exceptPlanId
  );
  if (duplicate) throw new Error(`Ngựa này đã có giáo án giai đoạn "${record.GiaiDoan}"`);
}

// Giáo án chỉ người tạo (CreatedBy) được sửa/xóa — BE cũng phải kiểm tra lại
function findOwnPlanOrThrow(planId, userId) {
  const plan = db.trainingPlans.find((p) => p.PlanID === Number(planId));
  if (!plan) throw new Error("Không tìm thấy giáo án");
  if (plan.CreatedBy !== Number(userId)) throw new Error("Bạn chỉ được sửa/xóa giáo án do chính mình tạo");
  return plan;
}

// Trả về null nếu không tìm thấy
export async function getTrainingPlanById(planId) {
  await delay();
  const plan = db.trainingPlans.find((p) => p.PlanID === Number(planId));
  return plan ? { ...plan } : null;
}

export async function createTrainingPlan(data) {
  await delay();
  const record = toPlanRecord(data);
  assertUniquePhase(record);
  const newPlan = {
    PlanID: nextId(db.trainingPlans, "PlanID"),
    ...record,
    CreatedBy: Number(data.CreatedBy),
  };
  db.trainingPlans.push(newPlan);
  planList.save();
  return { ...newPlan };
}

export async function updateTrainingPlan(planId, data, userId) {
  await delay();
  const plan = findOwnPlanOrThrow(planId, userId);
  const record = toPlanRecord(data);
  assertUniquePhase(record, plan.PlanID);
  Object.assign(plan, record);
  planList.save();
  return { ...plan };
}

export async function deleteTrainingPlan(planId, userId) {
  await delay();
  findOwnPlanOrThrow(planId, userId);
  planList.remove((p) => p.PlanID === Number(planId));
}

// Ngựa đang bị khóa tập: bản ghi TRAININGLOCK chưa gỡ (NgayGo = null)
// Đọc kho lệnh khóa dùng chung (vetService) nên thấy ngay lệnh khóa bác sĩ thú y vừa đặt
export async function getActiveTrainingLocks() {
  return getActiveLocks();
}

export async function getSchedules(date) {
  await delay();
  const items = date ? db.trainingSchedules.filter((s) => s.Ngay === date) : db.trainingSchedules;
  return clone(items).sort((a, b) => a.Ngay.localeCompare(b.Ngay) || a.Gio.localeCompare(b.Gio));
}

// Nhân viên chăm sóc (roleId "groom") theo field ERD, kèm isActive — chỉ người đang hoạt động mới được xếp lịch.
// Đọc từ accountService để thấy ngay khi Quản lý CLB khóa/mở khóa tài khoản.
export async function getGrooms() {
  const accounts = await getAccountUsers();
  return accounts
    .filter((u) => u.roleId === "groom")
    .map((u) => ({ UserID: toUserID(u.id), HoTen: u.fullName, isActive: u.isActive }));
}

// Trả về null nếu không tìm thấy
export async function getScheduleById(scheduleId) {
  await delay();
  const schedule = db.trainingSchedules.find((s) => s.ScheduleID === Number(scheduleId));
  return schedule ? { ...schedule } : null;
}

function toScheduleRecord(data) {
  return { HorseID: Number(data.HorseID), GroomID: Number(data.GroomID), Ngay: data.Ngay, Gio: data.Gio };
}

// Ràng buộc nghiệp vụ của lịch tập — BE cũng phải kiểm tra lại:
// ngựa đang khóa tập không được xếp; 1 nhân viên / 1 ngựa không có 2 buổi cùng ngày cùng giờ
function assertScheduleAllowed(record, exceptScheduleId = null) {
  if (isHorseLocked(record.HorseID)) {
    throw new Error("Ngựa đang bị khóa tập, không thể xếp lịch");
  }
  const sameSlot = db.trainingSchedules.filter(
    (s) => s.Ngay === record.Ngay && s.Gio === record.Gio && s.ScheduleID !== exceptScheduleId
  );
  if (sameSlot.some((s) => s.GroomID === record.GroomID)) {
    throw new Error(`Nhân viên đã có lịch lúc ${record.Gio} ngày ${formatDate(record.Ngay)}`);
  }
  if (sameSlot.some((s) => s.HorseID === record.HorseID)) {
    throw new Error(`Ngựa đã có lịch lúc ${record.Gio} ngày ${formatDate(record.Ngay)}`);
  }
}

export async function createSchedule(data) {
  await delay();
  const record = toScheduleRecord(data);
  if (record.Ngay < todayISO()) throw new Error("Ngày tập không được ở quá khứ");
  assertScheduleAllowed(record);
  const newSchedule = { ScheduleID: nextId(db.trainingSchedules, "ScheduleID"), ...record };
  db.trainingSchedules.push(newSchedule);
  scheduleList.save();
  return { ...newSchedule };
}

export async function updateSchedule(scheduleId, data) {
  await delay();
  const schedule = db.trainingSchedules.find((s) => s.ScheduleID === Number(scheduleId));
  if (!schedule) throw new Error("Không tìm thấy lịch tập");
  if (schedule.Ngay < todayISO()) throw new Error("Lịch tập đã qua, không thể sửa");
  const record = toScheduleRecord(data);
  assertScheduleAllowed(record, schedule.ScheduleID);
  Object.assign(schedule, record);
  scheduleList.save();
  return { ...schedule };
}

// Hủy lịch = xóa bản ghi TRAININGSCHEDULE (ERD không có cột trạng thái)
export async function cancelSchedule(scheduleId) {
  await delay();
  const schedule = db.trainingSchedules.find((s) => s.ScheduleID === Number(scheduleId));
  if (!schedule) throw new Error("Không tìm thấy lịch tập");
  if (schedule.Ngay < todayISO()) throw new Error("Lịch tập đã qua, không thể hủy");
  scheduleList.remove((s) => s.ScheduleID === schedule.ScheduleID);
}

export async function getTrainingSessions(horseId) {
  await delay();
  const sessions = horseId
    ? db.trainingSessions.filter((s) => s.HorseID === Number(horseId))
    : db.trainingSessions;
  return clone(sessions).sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.SessionID - a.SessionID);
}

// Chuẩn hóa dữ liệu từ form theo kiểu cột trong ERD (TRAININGSESSION)
function toSessionRecord(data) {
  return {
    HorseID: Number(data.HorseID),
    NhipTim: Number(data.NhipTim),
    VanToc: Number(data.VanToc),
    ChiSoTap: Number(data.ChiSoTap),
    NhanXet: (data.NhanXet ?? "").trim(),
    Ngay: data.Ngay,
  };
}

// Ràng buộc buổi tập — BE cũng phải kiểm tra lại:
// ngày không ở tương lai; số trong giới hạn; mỗi ngựa tối đa 1 buổi mỗi ngày
function assertSessionValid(record, exceptSessionId = null) {
  if (record.Ngay > todayISO()) throw new Error("Ngày tập không được ở tương lai");
  for (const [field, label] of [["NhipTim", "Nhịp tim"], ["VanToc", "Vận tốc"], ["ChiSoTap", "Chỉ số tập"]]) {
    const { min, max } = SESSION_LIMITS[field];
    if (!Number.isFinite(record[field]) || record[field] < min || record[field] > max) {
      throw new Error(`${label} phải trong khoảng ${min}–${max}`);
    }
  }
  if (record.NhanXet.length > SESSION_LIMITS.NhanXetMaxLength) throw new Error("Nhận xét quá dài");
  if (db.trainingSessions.some((s) => s.HorseID === record.HorseID && s.Ngay === record.Ngay && s.SessionID !== exceptSessionId)) {
    throw new Error("Ngựa này đã có buổi tập trong ngày đã chọn.");
  }
}

// Ghi nhận buổi tập mới — ngựa đang khóa tập thì chặn
export async function createTrainingSession(data) {
  await delay();
  const record = toSessionRecord(data);
  if (isHorseLocked(record.HorseID)) {
    throw new Error("Ngựa đang bị khóa tập, không thể ghi nhận buổi tập mới.");
  }
  assertSessionValid(record);
  const newSession = { SessionID: nextId(db.trainingSessions, "SessionID"), ...record };
  db.trainingSessions.push(newSession);
  sessionList.save();
  return { ...newSession };
}

// Sửa buổi tập đã có — vẫn cho sửa buổi cũ của ngựa đã bị khóa tập
export async function updateTrainingSession(sessionId, data) {
  await delay();
  const session = db.trainingSessions.find((s) => s.SessionID === Number(sessionId));
  if (!session) throw new Error("Không tìm thấy buổi tập");
  const record = toSessionRecord(data);
  if (record.HorseID !== session.HorseID && isHorseLocked(record.HorseID)) {
    throw new Error("Ngựa đang bị khóa tập, không thể ghi nhận buổi tập mới.");
  }
  assertSessionValid(record, session.SessionID);
  Object.assign(session, record);
  sessionList.save();
  return { ...session };
}

// ---- Hồ sơ ngựa (chỉ xem) ----

// Lịch tiêm phòng (VACCINATIONSCHEDULE) của 1 ngựa, NgayHen mới nhất trước
// Đọc kho lịch tiêm dùng chung (vetService) nên thấy ngay thay đổi của bác sĩ thú y; NgayHen mới nhất trước
export async function getVaccinationSchedules(horseId) {
  const items = await getVaccinations(horseId);
  return items.sort((a, b) => b.NgayHen.localeCompare(a.NgayHen));
}

// Ngày khám gần nhất của 1 ngựa từ MEDICALRECORD; null nếu chưa khám lần nào.
// Phân quyền: CHỈ trả HorseID + Ngay — HLV không được xem ChanDoan / PhacDo / ViTriChanThuong (BE cũng phải lọc cột)
// Đọc từ kho bệnh án của bác sĩ thú y (vetService) nên thấy ngay lần khám vừa ghi
export async function getLatestCheckupDate(horseId) {
  return getLatestExamDate(horseId);
}
