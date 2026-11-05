// MOCK luồng "chủ ngựa duyệt kế hoạch huấn luyện" — lưu localStorage (key "planApprovals"), CHƯA có API BE.
// Tách riêng khỏi trainingApi.js (API thật) để khi BE xong chỉ cần thay file này bằng lời gọi API, không sửa các trang.
// Mỗi hàm dưới đây là 1 endpoint dự kiến (xem TODO). Hàm async + trả dữ liệu giống JSON API.
// LƯU Ý: localStorage theo từng trình duyệt — demo bằng 1 trình duyệt, đổi tài khoản giữa các role.
import { PLAN_APPROVAL } from "../utils/planStatus";

const STORE_KEY = "planApprovals";
const NOTICE_KEY = "planApprovalNotices";
const CHANGED_EVENT = "planApprovals:changed";
const NOTE_MAX = 300;

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage bị chặn → bỏ qua (mock chỉ phục vụ demo)
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

const readAll = () => read(STORE_KEY, {});
const readNotices = () => read(NOTICE_KEY, []);

function pushNotice(notice) {
  write(NOTICE_KEY, [...readNotices(), { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, read: false, createdAt: new Date().toISOString(), ...notice }]);
}

// Ảnh chụp kế hoạch gửi cho chủ ngựa: KHÔNG gồm ghi chú nội bộ (plan.notes) của Trainer.
// Chủ ngựa không gọi được /api/trainer/** nên mock giữ bản chụp này; BE thật sẽ trả qua endpoint owner.
function toSnapshot(plan, trainerName) {
  return {
    planId: plan.planId,
    planName: plan.planName,
    horseId: plan.horseId,
    horseName: plan.horseName,
    trainerName,
    objective: plan.objective ?? "",
    trainingType: plan.trainingType ?? null,
    startDate: plan.startDate,
    endDate: plan.endDate,
    phases: (plan.phases ?? []).map((p) => ({
      phaseId: p.phaseId,
      phaseName: p.phaseName,
      goal: p.goal ?? "",
      startDate: p.startDate,
      endDate: p.endDate,
      intensityLevel: p.intensityLevel,
      targetDistanceKm: p.targetDistanceKm,
      sessionsPerWeek: p.sessionsPerWeek,
      sessionDurationMinutes: p.sessionDurationMinutes,
      surface: p.surface ?? null,
    })),
    sessions: (plan.sessions ?? [])
      .filter((s) => s.status !== "Cancelled")
      .map((s) => ({
        sessionId: s.sessionId,
        trainingDate: s.trainingDate,
        startTime: s.startTime,
        sessionTitle: s.sessionTitle ?? null,
        trainingType: s.trainingType ?? null,
        distanceKm: s.distanceKm ?? null,
        durationMinutes: s.durationMinutes ?? null,
        status: s.status ?? null,
      })),
  };
}

export const PLAN_APPROVAL_NOTE_MAX = NOTE_MAX;

// Cho các trang tự tải lại khi trạng thái đổi (cùng tab qua sự kiện nội bộ, tab khác qua "storage")
export function subscribePlanApprovals(callback) {
  const onStorage = (e) => {
    if (e.key === STORE_KEY || e.key === NOTICE_KEY || e.key === null) callback();
  };
  window.addEventListener(CHANGED_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGED_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

// ---- TRAINER ----

// TODO: thay bằng API BE — GET /api/trainer/training-plans/{id} (thêm field approvalStatus, approvalNote)
// Chưa gửi lần nào → mặc định Draft
export async function getPlanApproval(planId) {
  return readAll()[planId] ?? { planId: Number(planId), status: PLAN_APPROVAL.DRAFT, note: "" };
}

// TODO: thay bằng API BE — POST /api/trainer/training-plans/{id}/send
// plan: kế hoạch đầy đủ từ getTrainingPlan(); trainerName: người đang đăng nhập (BE tự lấy từ token)
export async function sendPlanToOwner(plan, trainerName) {
  const record = {
    planId: plan.planId,
    horseId: plan.horseId,
    status: PLAN_APPROVAL.PENDING,
    note: "",
    sentAt: new Date().toISOString(),
    decidedAt: null,
    snapshot: toSnapshot(plan, trainerName),
  };
  write(STORE_KEY, { ...readAll(), [plan.planId]: record });
  pushNotice({
    toRole: "horse_owner",
    horseId: plan.horseId,
    planId: plan.planId,
    text: `Có kế hoạch huấn luyện "${plan.planName}" của ${plan.horseName} cần bạn duyệt.`,
  });
  return record;
}

// Trainer sửa kế hoạch đang Chờ duyệt / Đã đồng ý → cập nhật bản chụp và quay về Chờ chủ ngựa duyệt
// TODO: thay bằng API BE — PUT /api/trainer/training-plans/{id} (BE tự đổi trạng thái về PendingOwner)
export async function resubmitEditedPlan(plan, trainerName) {
  const current = readAll()[plan.planId];
  if (!current || ![PLAN_APPROVAL.PENDING, PLAN_APPROVAL.APPROVED].includes(current.status)) return current ?? null;
  const record = await sendPlanToOwner(plan, trainerName);
  return record;
}

// ---- OWNER ----

// TODO: thay bằng API BE — GET /api/owner/horses/{horseId}/training-plans (gọi cho từng ngựa của chủ)
// Không trả kế hoạch Nháp. Mới nhất lên trên.
export async function getOwnerPlanApprovals(horseIds) {
  const ids = new Set(horseIds.map(Number));
  return Object.values(readAll())
    .filter((r) => ids.has(Number(r.horseId)) && r.status !== PLAN_APPROVAL.DRAFT)
    .sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""));
}

// TODO: thay bằng API BE — POST /api/owner/training-plans/{id}/approve
export async function approvePlan(planId) {
  const current = readAll()[planId];
  if (!current) throw new Error("Không tìm thấy kế hoạch.");
  const record = { ...current, status: PLAN_APPROVAL.APPROVED, note: "", decidedAt: new Date().toISOString() };
  write(STORE_KEY, { ...readAll(), [planId]: record });
  pushNotice({
    toRole: "head_trainer",
    horseId: record.horseId,
    planId: record.planId,
    text: `Chủ ngựa đã đồng ý kế hoạch "${record.snapshot.planName}" của ${record.snapshot.horseName}.`,
  });
  return record;
}

// TODO: thay bằng API BE — POST /api/owner/training-plans/{id}/request-changes, body { note } (bắt buộc, tối đa 300 ký tự)
export async function requestPlanChanges(planId, note) {
  const text = (note ?? "").trim();
  if (!text) throw new Error("Vui lòng nhập lý do cần chỉnh sửa.");
  if (text.length > NOTE_MAX) throw new Error(`Lý do tối đa ${NOTE_MAX} ký tự.`);
  const current = readAll()[planId];
  if (!current) throw new Error("Không tìm thấy kế hoạch.");
  const record = { ...current, status: PLAN_APPROVAL.CHANGES, note: text, decidedAt: new Date().toISOString() };
  write(STORE_KEY, { ...readAll(), [planId]: record });
  pushNotice({
    toRole: "head_trainer",
    horseId: record.horseId,
    planId: record.planId,
    text: `Chủ ngựa yêu cầu chỉnh sửa kế hoạch "${record.snapshot.planName}" của ${record.snapshot.horseName}.`,
  });
  return record;
}

// TODO: thay bằng API BE — POST /api/owner/training-plans/{id}/reject, body { note } (bắt buộc, tối đa 300 ký tự)
// Khác requestPlanChanges: "không dùng giáo án này" — Trainer phải soạn lại (đưa về Nháp) hoặc xóa.
export async function rejectPlan(planId, note) {
  const text = (note ?? "").trim();
  if (!text) throw new Error("Vui lòng nhập lý do từ chối.");
  if (text.length > NOTE_MAX) throw new Error(`Lý do tối đa ${NOTE_MAX} ký tự.`);
  const current = readAll()[planId];
  if (!current) throw new Error("Không tìm thấy kế hoạch.");
  const record = { ...current, status: PLAN_APPROVAL.REJECTED, note: text, decidedAt: new Date().toISOString() };
  write(STORE_KEY, { ...readAll(), [planId]: record });
  pushNotice({
    toRole: "head_trainer",
    horseId: record.horseId,
    planId: record.planId,
    text: `Chủ ngựa đã từ chối kế hoạch "${record.snapshot.planName}" của ${record.snapshot.horseName}.`,
  });
  return record;
}

// ---- TRAINER: sau khi bị từ chối ----

// Đưa kế hoạch về Nháp (soạn lại) hoặc dọn bản ghi khi xóa kế hoạch → getPlanApproval trả lại mặc định Draft
// TODO: thay bằng API BE — BE tự đổi trạng thái về Draft khi Trainer sửa kế hoạch bị từ chối; xóa kế hoạch thì xóa kèm bản ghi duyệt
export async function clearPlanApproval(planId) {
  const all = readAll();
  if (!all[planId]) return;
  const { [planId]: removed, ...rest } = all; // eslint-disable-line no-unused-vars
  write(STORE_KEY, rest);
}

// Trạng thái duyệt của mọi kế hoạch (planId → status) cho danh sách kế hoạch của Trainer
// TODO: thay bằng API BE — GET /api/trainer/training-plans (thêm field approvalStatus vào từng dòng)
export async function getPlanApprovalMap() {
  return Object.fromEntries(Object.values(readAll()).map((r) => [r.planId, r.status]));
}

// ---- LỊCH TẬP CHO CHỦ NGỰA (cầu nối tạm) ----
// Phía Trainer ghi buổi tập vào BE thật (/api/trainer/training-sessions, chỉ head_trainer gọi được), còn Chủ ngựa CHƯA có endpoint
// đọc lịch tập. Tạm thời: mỗi lần Trainer mở / xếp lịch kế hoạch ĐÃ ĐỒNG Ý thì chép danh sách buổi vào bản chụp của mock này,
// Chủ ngựa đọc lại từ đó (cùng trình duyệt).
// TODO: thay bằng API BE — GET /api/owner/schedule?from&to (buổi tập của mọi ngựa thuộc chủ, chỉ kế hoạch Approved, ẩn ghi chú nội bộ)
export async function syncPlanSessions(plan) {
  const current = readAll()[plan.planId];
  if (!current || current.status !== PLAN_APPROVAL.APPROVED) return;
  const sessions = toSnapshot(plan, current.snapshot.trainerName).sessions;
  if (JSON.stringify(sessions) === JSON.stringify(current.snapshot.sessions)) return; // không đổi → khỏi ghi, tránh vòng lặp sự kiện
  write(STORE_KEY, { ...readAll(), [plan.planId]: { ...current, snapshot: { ...current.snapshot, sessions } } });
}

// Buổi tập sắp tới của các ngựa thuộc chủ, chỉ từ kế hoạch Đã đồng ý, chưa hủy / chưa hoàn thành, trong [from, to] (yyyy-MM-dd)
export async function getOwnerUpcomingSessions(horseIds, { from, to }) {
  const ids = new Set(horseIds.map(Number));
  return Object.values(readAll())
    .filter((r) => r.status === PLAN_APPROVAL.APPROVED && ids.has(Number(r.horseId)))
    .flatMap((r) =>
      r.snapshot.sessions
        .filter((s) => (!s.status || s.status === "Scheduled" || s.status === "InProgress") && s.trainingDate >= from && s.trainingDate <= to)
        .map((s) => ({
          key: `${r.planId}-${s.sessionId ?? s.trainingDate + s.startTime}`,
          horseId: Number(r.horseId),
          planId: r.planId,
          date: s.trainingDate,
          time: s.startTime,
          trainingType: s.trainingType,
          title: s.sessionTitle ?? null,
          distanceKm: s.distanceKm ?? null,
          durationMinutes: s.durationMinutes ?? null,
        }))
    );
}

// ---- THÔNG BÁO (huy hiệu "Mới" ở menu) ----
// TODO: thay bằng cơ chế thông báo BE (SignalR như useHorseRealtime) khi có

// roleId "head_trainer": mọi thông báo gửi cho HLV; "horse_owner": chỉ ngựa của chủ (horseIds)
export function countUnreadNotices(roleId, horseIds = null) {
  const ids = horseIds ? new Set(horseIds.map(Number)) : null;
  return readNotices().filter((n) => n.toRole === roleId && !n.read && (!ids || ids.has(Number(n.horseId)))).length;
}

// Đánh dấu đã đọc: theo kế hoạch (Trainer mở chi tiết kế hoạch) hoặc theo danh sách ngựa (Chủ ngựa mở Lịch trình)
export function markNoticesRead(roleId, { planId, horseIds } = {}) {
  const ids = horseIds ? new Set(horseIds.map(Number)) : null;
  const notices = readNotices();
  let changed = false;
  const next = notices.map((n) => {
    if (n.toRole !== roleId || n.read) return n;
    if (planId != null && Number(n.planId) !== Number(planId)) return n;
    if (ids && !ids.has(Number(n.horseId))) return n;
    changed = true;
    return { ...n, read: true };
  });
  if (changed) write(NOTICE_KEY, next);
}
