// MOCK luồng "Đăng ký thi đấu" nhiều bước (Trainer → Chủ ngựa → Quản lý) — lưu localStorage (key "raceRegistrations"), CHƯA có API BE.
// Tách riêng khỏi raceService.js (API thật: ma trận đăng ký + kết quả) để khi BE xong chỉ cần thay file này bằng lời gọi API.
// Mỗi hàm là 1 endpoint dự kiến (xem TODO). LƯU Ý: localStorage theo từng trình duyệt — demo bằng 1 trình duyệt, đổi tài khoản giữa các role.
import { getRaceRegistrations, getRaces, registerHorseForRace } from "./raceService";
import { addDays, todayISO } from "../utils/date";
import { ACTION_STATUS_BY_ROLE, RR_DEADLINE_DAYS_BEFORE, RR_NOTE_MAX, RR_STATUS } from "../utils/raceRegistration";

const STORE_KEY = "raceRegistrations";
const SAMPLE_ENTRY_FEES = [5000000, 8000000, 12000000];
const CHANGED_EVENT = "raceRegistrations:changed";
const OPEN = [RR_STATUS.DRAFT, RR_STATUS.PENDING_OWNER, RR_STATUS.PENDING_MANAGER, RR_STATUS.APPROVED]; // "còn hiệu lực" khi kiểm tra trùng ngày
const PENDING = [RR_STATUS.DRAFT, RR_STATUS.PENDING_OWNER, RR_STATUS.PENDING_MANAGER];

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {
    // localStorage bị chặn → bỏ qua (mock chỉ phục vụ demo)
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

// Quá hạn đăng ký mà chưa chốt (Nháp / đang chờ duyệt) → Hết hạn (tính khi đọc, không ghi lại)
function withExpiry(record) {
  if (PENDING.includes(record.status) && record.registrationDeadline < todayISO()) return { ...record, status: RR_STATUS.EXPIRED };
  return record;
}

const nextId = (list) => list.reduce((max, r) => Math.max(max, r.id), 0) + 1;
const historyEntry = (step, action, by, note = "") => ({ step, action, by, note, at: new Date().toISOString() });

function validateNote(note, { required }) {
  const text = (note ?? "").trim();
  if (required && !text) throw new Error("Vui lòng nhập lý do.");
  if (text.length > RR_NOTE_MAX) throw new Error(`Lý do tối đa ${RR_NOTE_MAX} ký tự.`);
  return text;
}

// Một ngựa không có hai đăng ký còn hiệu lực cùng ngày cuộc đua
function assertNoSameDay(list, horseId, raceDate, exceptId) {
  const clash = list.find(
    (r) => r.id !== exceptId && Number(r.horseId) === Number(horseId) && r.raceDate === raceDate && OPEN.includes(withExpiry(r).status)
  );
  if (clash) throw new Error("Ngựa này đã có đăng ký khác trong cùng ngày cuộc đua.");
}

function update(id, change) {
  const list = readAll();
  const index = list.findIndex((r) => r.id === Number(id));
  if (index < 0) throw new Error("Không tìm thấy đăng ký.");
  const next = change(list[index], list);
  const saved = [...list];
  saved[index] = next;
  writeAll(saved);
  return withExpiry(next);
}

export function subscribeRaceRegistrations(callback) {
  const onStorage = (e) => {
    if (e.key === STORE_KEY || e.key === null) callback();
  };
  window.addEventListener(CHANGED_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGED_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

// Lệ phí mẫu theo mã giải (DỮ LIỆU MẪU chờ BE có entryFee) — dùng chung cho danh mục cuộc đua và bản ghi dựng từ đăng ký cũ
export const sampleEntryFee = (raceId) => SAMPLE_ENTRY_FEES[Number(raceId) % SAMPLE_ENTRY_FEES.length];

// Hạn đăng ký tạm tính (BE chưa trả registrationDeadline)
export const raceRegistrationDeadline = (race) => addDays(race.Ngay, -RR_DEADLINE_DAYS_BEFORE);

// Đăng ký thật (RACEREGISTRATION của BE) KHÔNG có bản ghi trong luồng duyệt (đăng ký trực tiếp trước khi có luồng duyệt)
// → dựng bản ghi chỉ-đọc từ dữ liệu thật để hiện chi tiết. direct = true: khung chi tiết ghi "Đăng ký trực tiếp trước khi có luồng duyệt".
export function buildDirectRegistration(race, registration, horseName) {
  return {
    id: -Number(registration.HorseID) * 100000 - Number(race.RaceID),
    direct: true,
    horseId: Number(registration.HorseID),
    horseName,
    raceId: race.RaceID,
    raceName: race.TenGiai,
    raceDate: race.Ngay,
    raceLocation: race.DiaDiem,
    registrationDeadline: addDays(race.Ngay, -RR_DEADLINE_DAYS_BEFORE),
    entryFee: sampleEntryFee(race.RaceID),
    note: "",
    trainerName: "",
    status: RR_STATUS.APPROVED,
    rejectedBy: null,
    rejectReason: "",
    createdAt: registration.NgayDangKy ? `${registration.NgayDangKy}T00:00:00` : "",
    history: [],
  };
}

// ---- Danh mục cuộc đua để tạo đăng ký ----
// TODO: thay bằng API BE — GET /api/races (thêm field registrationDeadline, entryFee cho từng cuộc đua; hiện chưa có)
// Hạn đăng ký tạm tính = 7 ngày trước ngày đua; lệ phí là DỮ LIỆU MẪU (5 / 8 / 12 triệu) vì BE chưa trả entryFee.
export async function getRaceOptions() {
  const races = await getRaces();
  return races.map((race) => ({
    ...race,
    registrationDeadline: addDays(race.Ngay, -RR_DEADLINE_DAYS_BEFORE),
    // DỮ LIỆU MẪU: lệ phí do FE tự gán theo mã giải, chờ BE có field entryFee thật (GET /api/races)
    entryFee: sampleEntryFee(race.RaceID),
  }));
}

// ---- Đọc ----

// TODO: thay bằng API BE — GET /api/trainer/race-registrations | GET /api/owner/race-registrations | GET /api/manager/race-registrations
// role: "head_trainer" (tất cả) | "horse_owner" (ngựa của chủ, bỏ Nháp) | "club_manager" (bỏ Nháp). horseIds: mã ngựa của chủ.
export async function listRaceRegistrations(role, { horseIds = [] } = {}) {
  const ids = new Set(horseIds.map(Number));
  return readAll()
    .map(withExpiry)
    .filter((r) => {
      if (role === "head_trainer") return true;
      if (r.status === RR_STATUS.DRAFT) return false;
      // Chủ ngựa / Quản lý chỉ thấy đăng ký đã gửi; đăng ký đã Hết hạn / Đã rút mà chưa từng gửi thì không liên quan
      if (!r.history.some((h) => h.action === "Gửi duyệt")) return false;
      return role === "horse_owner" ? ids.has(Number(r.horseId)) : true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// TODO: thay bằng API BE — GET /api/race-registrations/{id}
export async function getRaceRegistration(id) {
  const record = readAll().find((r) => r.id === Number(id));
  return record ? withExpiry(record) : null;
}

// ---- TRAINER ----

// TODO: thay bằng API BE — POST /api/trainer/race-registrations, body { horseId, raceId, note } → Draft
// race: một phần tử của getRaceOptions(); horse: { horseId, name }
export async function createRaceRegistration({ horse, race, note }, trainerName) {
  if (!horse) throw new Error("Vui lòng chọn ngựa.");
  if (!race) throw new Error("Vui lòng chọn cuộc đua.");
  if (race.registrationDeadline < todayISO()) throw new Error("Cuộc đua đã quá hạn đăng ký.");
  const text = (note ?? "").trim();
  if (text.length > RR_NOTE_MAX) throw new Error(`Ghi chú tối đa ${RR_NOTE_MAX} ký tự.`);
  const list = readAll();
  assertNoSameDay(list, horse.horseId, race.Ngay);
  const record = {
    id: nextId(list),
    horseId: Number(horse.horseId),
    horseName: horse.name,
    raceId: race.RaceID,
    raceName: race.TenGiai,
    raceDate: race.Ngay,
    raceLocation: race.DiaDiem,
    registrationDeadline: race.registrationDeadline,
    entryFee: race.entryFee,
    note: text,
    trainerName,
    status: RR_STATUS.DRAFT,
    rejectedBy: null,
    rejectReason: "",
    createdAt: new Date().toISOString(),
    history: [historyEntry("Trainer", "Tạo nháp", trainerName, text)],
  };
  writeAll([...list, record]);
  return record;
}

// TODO: thay bằng API BE — POST /api/trainer/race-registrations/{id}/submit (Draft → PendingOwner)
export async function submitRaceRegistration(id, trainerName) {
  return update(id, (record, list) => {
    if (withExpiry(record).status === RR_STATUS.EXPIRED) throw new Error("Cuộc đua đã quá hạn đăng ký.");
    if (record.status !== RR_STATUS.DRAFT) throw new Error("Chỉ gửi duyệt được đăng ký đang ở trạng thái Nháp.");
    assertNoSameDay(list, record.horseId, record.raceDate, record.id);
    return { ...record, status: RR_STATUS.PENDING_OWNER, history: [...record.history, historyEntry("Trainer", "Gửi duyệt", trainerName)] };
  });
}

// TODO: thay bằng API BE — POST /api/trainer/race-registrations/{id}/withdraw (khi chưa Approved)
export async function withdrawRaceRegistration(id, trainerName) {
  return update(id, (record) => {
    if (!PENDING.includes(record.status)) throw new Error("Chỉ rút được đăng ký chưa duyệt xong.");
    return { ...record, status: RR_STATUS.WITHDRAWN, history: [...record.history, historyEntry("Trainer", "Rút đăng ký", trainerName)] };
  });
}

// ---- CHỦ NGỰA ----

// TODO: thay bằng API BE — POST /api/owner/race-registrations/{id}/decision, body { approve, note } (từ chối: note bắt buộc, ≤ 300 ký tự)
export async function ownerDecideRaceRegistration(id, { approve, note }, ownerName) {
  const text = validateNote(note, { required: !approve });
  return update(id, (record) => {
    if (withExpiry(record).status !== RR_STATUS.PENDING_OWNER) throw new Error("Đăng ký không còn ở bước chủ ngựa duyệt.");
    if (approve) {
      return { ...record, status: RR_STATUS.PENDING_MANAGER, history: [...record.history, historyEntry("Owner", "Đồng ý", ownerName)] };
    }
    return {
      ...record,
      status: RR_STATUS.REJECTED,
      rejectedBy: "Owner",
      rejectReason: text,
      trainerSeen: false,
      history: [...record.history, historyEntry("Owner", "Từ chối", ownerName, text)],
    };
  });
}

// ---- QUẢN LÝ ----

// TODO: thay bằng API BE — POST /api/manager/race-registrations/{id}/decision, body { approve, note } (từ chối: note bắt buộc, ≤ 300 ký tự)
export async function managerDecideRaceRegistration(id, { approve, note }, managerName) {
  const text = validateNote(note, { required: !approve });
  let syncedToBE = true;
  if (approve) {
    // Duyệt = đăng ký thật vào giải (API /races/{id}/registrations) để ma trận, lịch chủ ngựa, chi phí thấy. Lỗi API → KHÔNG đổi sang Approved.
    const current = await getRaceRegistration(id);
    if (!current) throw new Error("Không tìm thấy đăng ký.");
    if (current.status !== RR_STATUS.PENDING_MANAGER) throw new Error("Đăng ký không còn ở bước quản lý duyệt.");
    try {
      await ensureBackendRegistration(current);
    } catch (err) {
      // TODO(BE): TẠM THỜI — BE chỉ cho Huấn luyện viên gọi POST /api/races/{id}/registrations nên Quản lý bị 403.
      // Vẫn chuyển sang Approved (đăng ký chỉ nằm trong mock, ma trận Kết quả thi đấu chưa thấy). GỠ nhánh 403 này khi BE cấp quyền cho Quản lý.
      if (err?.status !== 403) throw err;
      syncedToBE = false;
    }
  }
  return update(id, (record) => {
    if (withExpiry(record).status !== RR_STATUS.PENDING_MANAGER) throw new Error("Đăng ký không còn ở bước quản lý duyệt.");
    if (approve) {
      return { ...record, status: RR_STATUS.APPROVED, syncedToBE, trainerSeen: false, history: [...record.history, historyEntry("Manager", "Duyệt", managerName)] };
    }
    return {
      ...record,
      status: RR_STATUS.REJECTED,
      rejectedBy: "Manager",
      rejectReason: text,
      trainerSeen: false,
      history: [...record.history, historyEntry("Manager", "Từ chối", managerName, text)],
    };
  });
}

// Ghi đăng ký thật nếu chưa có (cùng ngựa cùng giải thì bỏ qua, không tạo trùng)
async function ensureBackendRegistration(record) {
  const existing = await getRaceRegistrations();
  if (existing.some((r) => Number(r.HorseID) === Number(record.horseId) && Number(r.RaceID) === Number(record.raceId))) return;
  await registerHorseForRace(record.raceId, record.horseId);
}

// ---- Dùng cho các màn khác ----

// Đồng bộ các đăng ký ĐÃ DUYỆT mà chưa tạo được đăng ký thật (syncedToBE === false, do Quản lý bị 403 lúc duyệt).
// Chạy bằng tài khoản Trainer (Trainer có quyền gọi registerHorseForRace) khi Trainer mở trang Đăng ký thi đấu / Kết quả thi đấu.
// Bản ghi nào lỗi thì giữ nguyên cờ để thử lại lần sau. Trả { synced, failed }.
// TODO(BE): GỠ hàm này (và cờ syncedToBE) khi BE cho Quản lý gọi POST /api/races/{raceId}/registrations hoặc tự tạo đăng ký thật khi duyệt.
export async function syncPendingRegistrations() {
  const targets = readAll().filter((r) => r.status === RR_STATUS.APPROVED && r.syncedToBE === false);
  const syncedIds = new Set();
  let failed = 0;
  for (const record of targets) {
    try {
      await ensureBackendRegistration(record);
      syncedIds.add(record.id);
    } catch {
      failed += 1;
    }
  }
  if (syncedIds.size > 0) {
    // Đọc lại danh sách ngay trước khi ghi để không đè thay đổi xảy ra trong lúc gọi API
    writeAll(readAll().map((r) => (syncedIds.has(r.id) ? { ...r, syncedToBE: true } : r)));
  }
  return { synced: syncedIds.size, failed };
}

// Trainer mở khung chi tiết đăng ký đã có kết quả (Đã duyệt / Bị từ chối) → đã xem, tắt huy hiệu "Mới"
export async function markRaceRegistrationSeen(id) {
  const list = readAll();
  const index = list.findIndex((r) => r.id === Number(id));
  if (index < 0 || list[index].trainerSeen !== false) return;
  const next = [...list];
  next[index] = { ...list[index], trainerSeen: true };
  writeAll(next);
}

// Số đăng ký đang chờ chính vai trò đó xử lý (huy hiệu "Mới" ở menu). Trainer: số bản Nháp chưa gửi.
export async function countRaceRegistrationsWaiting(role, { horseIds = [] } = {}) {
  const list = await listRaceRegistrations(role, { horseIds });
  // Trainer: đăng ký của mình vừa được duyệt / bị từ chối mà chưa xem
  if (role === "head_trainer") return list.filter((r) => [RR_STATUS.APPROVED, RR_STATUS.REJECTED].includes(r.status) && r.trainerSeen === false).length;
  return list.filter((r) => r.status === ACTION_STATUS_BY_ROLE[role]).length;
}

// Cuộc đua ĐÃ DUYỆT của các ngựa thuộc chủ, trong [from, to] — hiện ở "Sắp tới" của Lịch trình chủ ngựa
// TODO: thay bằng API BE — GET /api/owner/schedule?from&to (gộp cùng buổi tập)
export async function getOwnerApprovedRaces(horseIds, { from, to }) {
  const ids = new Set(horseIds.map(Number));
  return readAll()
    .filter((r) => r.status === RR_STATUS.APPROVED && ids.has(Number(r.horseId)) && r.raceDate >= from && r.raceDate <= to)
    .map((r) => ({ key: `rr${r.id}`, horseId: Number(r.horseId), date: r.raceDate, name: r.raceName, location: r.raceLocation }));
}
