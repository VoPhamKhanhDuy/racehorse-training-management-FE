// TODO: thay bằng gọi API thật khi BE xong
// Mock API cho Bác sĩ thú y: bệnh án (MEDICALRECORD), lệnh khóa huấn luyện (TRAININGLOCK) + cập nhật HEALTHSTATUS sau khám.
// Bệnh án giữ trong bộ nhớ của module (mất khi tải lại trang); HLV trưởng đọc "Ngày khám gần nhất" từ cùng kho này.
import medicalRecords from "../data/medicalRecords";
import trainingLocks from "../data/trainingLocks";
import vaccinations from "../data/vaccinations";
import {
  INJURY_LOCATIONS,
  INJURY_SEPARATOR,
  LOCK_REASON_LIMITS,
  MEDICAL_LIMITS,
  NO_INJURY,
  RELEASE_HEALTH_STATES,
  TREATMENT_STATE,
} from "../data/medicalRecordOptions";
import {
  DUPLICATE_PENDING_VACCINE,
  VACCINE_DONE,
  VACCINE_PENDING,
  VACCINE_TYPE_LIMITS,
  VACCINE_TYPES,
} from "../data/vaccinationOptions";
import { getUsers as getAccountUsers } from "./accountService";
import { createPersistedList } from "./persistedStore";
import { getHealthStatuses, getHorses, updateHealthStatus } from "./horseService";
import { toUserID } from "../utils/userId";
import { todayISO } from "../utils/date";

// Ngựa + tình trạng sức khỏe dùng chung kho với các màn khác
export { getHealthStatuses, getHorses };

const NETWORK_DELAY_MS = 400;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lưu bền: SEED + lớp thay đổi trong localStorage (services/persistedStore.js)
const recordList = createPersistedList("medicalRecords", medicalRecords, "RecordID");
const recordStore = recordList.items;

// Mới nhất trước: theo Ngay, cùng ngày thì bản ghi tạo sau trước
const byNewest = (a, b) => b.Ngay.localeCompare(a.Ngay) || b.RecordID - a.RecordID;

// Danh sách bệnh án (mới nhất trước); horseId để lọc 1 ngựa
export async function getMedicalRecords(horseId) {
  await delay();
  const records = horseId ? recordStore.filter((r) => r.HorseID === Number(horseId)) : recordStore;
  return records.map((r) => ({ ...r })).sort(byNewest);
}

// Trả về null nếu không tìm thấy
export async function getMedicalRecordById(recordId) {
  await delay();
  const record = recordStore.find((r) => r.RecordID === Number(recordId));
  return record ? { ...record } : null;
}

// Ngày khám gần nhất của 1 ngựa — CHỈ trả HorseID + Ngay (dùng cho HLV trưởng, không lộ chẩn đoán/phác đồ)
export async function getLatestExamDate(horseId) {
  await delay();
  const latest = recordStore
    .filter((r) => r.HorseID === Number(horseId))
    .reduce((max, r) => (r.Ngay > max ? r.Ngay : max), "");
  return latest ? { HorseID: Number(horseId), Ngay: latest } : null;
}

// HorseID có bệnh án — dùng khi kiểm tra ngựa có dữ liệu liên quan trước khi xóa hồ sơ
export function getHorseIdsWithRecords() {
  return new Set(recordStore.map((r) => r.HorseID));
}

// Bác sĩ thú y (roleId "veterinarian") theo field ERD — hiện tên "BS. ..." trong sổ khám bệnh
export async function getVets() {
  const accounts = await getAccountUsers();
  return accounts.filter((u) => u.roleId === "veterinarian").map((u) => ({ UserID: toUserID(u.id), HoTen: u.fullName }));
}

// ---- Lệnh khóa huấn luyện (TRAININGLOCK) ----
// Kho dùng chung cho mọi role: HLV trưởng đọc qua trainerService để chặn xếp lịch / ghi buổi tập / đăng ký thi đấu.
const lockList = createPersistedList("trainingLocks", trainingLocks, "LockID");
const lockStore = lockList.items;

// Mọi lệnh khóa huấn luyện, kể cả đã gỡ (ngăn chi tiết bệnh án tìm lệnh khóa đặt cùng ngày khám)
export async function getTrainingLocks() {
  await delay();
  return lockStore.map((l) => ({ ...l }));
}

// Lệnh khóa huấn luyện đang hiệu lực (TRAININGLOCK chưa gỡ)
export async function getActiveTrainingLocks() {
  await delay();
  return lockStore.filter((l) => !l.NgayGo).map((l) => ({ ...l }));
}

// Ngựa có lệnh khóa đang hiệu lực không (đồng bộ, cho các ràng buộc trong service)
export function isHorseLocked(horseId) {
  return lockStore.some((l) => l.HorseID === Number(horseId) && !l.NgayGo);
}

// HorseID từng có lệnh khóa (kể cả đã gỡ) — dùng khi kiểm tra ngựa có dữ liệu liên quan trước khi xóa hồ sơ
export function getHorseIdsWithLocks() {
  return new Set(lockStore.map((l) => l.HorseID));
}

const LOCK_REASON_MAX = LOCK_REASON_LIMITS.max;
const nextLockId = () => lockStore.reduce((max, l) => Math.max(max, l.LockID), 0) + 1;

// Đặt lệnh khóa thủ công. Ràng buộc (BE cũng phải kiểm tra lại): mỗi ngựa tối đa 1 lệnh khóa đang hiệu lực;
// ngày đặt không ở tương lai; lý do 5–200 ký tự. Có khóa thì tình trạng phải là "Đang điều trị" → tự cập nhật HEALTHSTATUS.
export async function createTrainingLock(data, vetId) {
  await delay();
  const horseId = Number(data.HorseID);
  const reason = data.LyDo.trim().replace(/\s+/g, " ");
  if (isHorseLocked(horseId)) throw new Error("Ngựa này đang có lệnh khóa huấn luyện hiệu lực");
  if (!data.NgayDat || data.NgayDat > todayISO()) throw new Error("Ngày đặt không được ở tương lai");
  if (reason.length < LOCK_REASON_LIMITS.min || reason.length > LOCK_REASON_LIMITS.max) throw new Error("Lý do không hợp lệ");
  const lock = { LockID: nextLockId(), HorseID: horseId, VetID: Number(vetId), LyDo: reason, NgayDat: data.NgayDat, NgayGo: null };
  lockStore.push(lock);
  lockList.save();
  const health = (await getHealthStatuses()).find((h) => h.HorseID === horseId);
  if (health?.TrangThai !== TREATMENT_STATE) await updateHealthStatus(horseId, TREATMENT_STATE, todayISO());
  return { ...lock };
}

// Gỡ lệnh khóa (không xóa — giữ lịch sử): NgayGo = hôm nay; tình trạng sức khỏe mới do bác sĩ chọn
// ("Cần theo dõi" | "Tốt", NgayCapNhat = hôm nay). Trả lệnh khóa sau khi gỡ.
export async function releaseTrainingLock(lockId, newStatus) {
  await delay();
  const lock = lockStore.find((l) => l.LockID === Number(lockId));
  if (!lock) throw new Error("Không tìm thấy lệnh khóa");
  if (lock.NgayGo) throw new Error("Lệnh khóa này đã được gỡ");
  if (!RELEASE_HEALTH_STATES.includes(newStatus)) throw new Error("Vui lòng chọn tình trạng sức khỏe mới");
  lock.NgayGo = todayISO();
  lockList.save();
  await updateHealthStatus(lock.HorseID, newStatus, lock.NgayGo);
  return { ...lock };
}

// Điều kiện tự động đặt lệnh khóa sau khi lưu bệnh án: có chấn thương + tình trạng "Đang điều trị" + chưa bị khóa.
// "Cần theo dõi" thì không tự khóa dù có chấn thương. Form dùng lại để hiện dòng nhắc trước khi lưu.
export function shouldAutoLock(injuries, trangThai, horseLocked) {
  const hasInjury = injuries.length > 0 && !injuries.includes(NO_INJURY);
  return hasInjury && trangThai === TREATMENT_STATE && !horseLocked;
}

// Tạo lệnh khóa từ bệnh án vừa lưu: LyDo = "Chấn thương: {vị trí} - {chẩn đoán}" (tối đa 200 ký tự), NgayDat = ngày khám
function createLockFromRecord(record, vetId) {
  const reason = `Chấn thương: ${record.ViTriChanThuong} - ${record.ChanDoan}`;
  const lock = {
    LockID: nextLockId(),
    HorseID: record.HorseID,
    VetID: Number(vetId),
    LyDo: reason.length > LOCK_REASON_MAX ? `${reason.slice(0, LOCK_REASON_MAX - 1)}…` : reason,
    NgayDat: record.Ngay,
    NgayGo: null,
  };
  lockStore.push(lock);
  lockList.save();
  return { ...lock };
}

// Sau khi lưu bệnh án: tự đặt lệnh khóa nếu thỏa điều kiện. Trả lệnh khóa vừa tạo hoặc null.
function autoLockIfNeeded(record, injuries, trangThai, vetId) {
  return shouldAutoLock(injuries, trangThai, isHorseLocked(record.HorseID)) ? createLockFromRecord(record, vetId) : null;
}

// Chuẩn hóa dữ liệu form theo cột ERD. injuries: mảng vị trí đã chọn → chuỗi nối ", "
function toRecord(data) {
  return {
    HorseID: Number(data.HorseID),
    Ngay: data.Ngay,
    ChanDoan: data.ChanDoan.trim().replace(/\s+/g, " "),
    PhacDo: data.PhacDo.trim(),
    ViTriChanThuong: data.injuries.includes(NO_INJURY) ? NO_INJURY : data.injuries.join(INJURY_SEPARATOR),
  };
}

// Ràng buộc bệnh án — BE cũng phải kiểm tra lại
function assertRecordValid(record, injuries) {
  if (!record.Ngay || record.Ngay > todayISO()) throw new Error("Ngày khám không được ở tương lai");
  const { ChanDoan, PhacDo } = MEDICAL_LIMITS;
  if (record.ChanDoan.length < ChanDoan.min || record.ChanDoan.length > ChanDoan.max) throw new Error("Chẩn đoán không hợp lệ");
  if (record.PhacDo.length < PhacDo.min || record.PhacDo.length > PhacDo.max) throw new Error("Phác đồ điều trị không hợp lệ");
  const valid = injuries.length > 0 && injuries.every((i) => i === NO_INJURY || INJURY_LOCATIONS.includes(i));
  if (!valid || (injuries.includes(NO_INJURY) && injuries.length > 1)) throw new Error("Vị trí chấn thương không hợp lệ");
}

// Lần khám mới nhất của ngựa (theo Ngay, rồi RecordID) — chỉ lần này được đổi tình trạng sức khỏe khi sửa
function isLatestRecordOfHorse(record) {
  const latest = recordStore.filter((r) => r.HorseID === record.HorseID).sort(byNewest)[0];
  return latest?.RecordID === record.RecordID;
}

// Ghi lần khám mới. VetID = bác sĩ đang đăng nhập. TrangThai (tùy chọn): tình trạng sức khỏe sau khám.
// Trả { record, healthUpdated, lock } — healthUpdated = false nếu ngày khám cũ hơn NgayCapNhat hiện tại;
// lock: lệnh khóa huấn luyện vừa tự động đặt (null nếu không).
export async function createMedicalRecord(data, vetId) {
  await delay();
  const record = toRecord(data);
  assertRecordValid(record, data.injuries);
  const newRecord = { RecordID: recordStore.reduce((max, r) => Math.max(max, r.RecordID), 0) + 1, VetID: Number(vetId), ...record };
  recordStore.push(newRecord);
  recordList.save();
  const healthUpdated = data.TrangThai ? await updateHealthStatus(record.HorseID, data.TrangThai, record.Ngay) : false;
  const lock = autoLockIfNeeded(newRecord, data.injuries, data.TrangThai, vetId);
  return { record: { ...newRecord }, healthUpdated, lock };
}

// Sửa bệnh án — chỉ bác sĩ đã ghi (VetID) được sửa, không đổi ngựa. Bệnh án KHÔNG có thao tác xóa.
export async function updateMedicalRecord(recordId, data, vetId) {
  await delay();
  const current = recordStore.find((r) => r.RecordID === Number(recordId));
  if (!current) throw new Error("Không tìm thấy bệnh án");
  if (current.VetID !== Number(vetId)) throw new Error("Bạn chỉ được sửa bệnh án do chính mình ghi");
  const record = { ...toRecord(data), HorseID: current.HorseID };
  assertRecordValid(record, data.injuries);
  Object.assign(current, record);
  recordList.save();
  const canUpdateHealth = data.TrangThai && isLatestRecordOfHorse(current);
  const healthUpdated = canUpdateHealth ? await updateHealthStatus(current.HorseID, data.TrangThai, current.Ngay) : false;
  // Tình trạng chỉ đổi được ở lần khám mới nhất → chỉ lần đó mới có thể tự đặt lệnh khóa
  const lock = canUpdateHealth ? autoLockIfNeeded(current, data.injuries, data.TrangThai, vetId) : null;
  return { record: { ...current }, healthUpdated, lock };
}

// Bản ghi đang sửa có phải lần khám mới nhất của ngựa không (form sửa chỉ hiện ô tình trạng khi đúng)
export async function isLatestMedicalRecord(recordId) {
  await delay(0);
  const record = recordStore.find((r) => r.RecordID === Number(recordId));
  return Boolean(record) && isLatestRecordOfHorse(record);
}

// ---- Lịch tiêm phòng / tẩy giun (VACCINATIONSCHEDULE) ----
// Kho dùng chung: HLV trưởng đọc qua trainerService (hồ sơ ngựa), kiểm tra xóa ngựa đọc getHorseIdsWithVaccinations.
// TrangThai chỉ lưu "Chờ tiêm" | "Đã tiêm"; "Quá hạn" / "Sắp tới" tính bằng getVaccineState (utils/healthAlerts.js).
const vaccineList = createPersistedList("vaccinations", vaccinations, "ScheduleID");
const vaccineStore = vaccineList.items;
const nextVaccineId = () => vaccineStore.reduce((max, v) => Math.max(max, v.ScheduleID), 0) + 1;
const sameText = (a, b) => a.toLocaleLowerCase("vi") === b.toLocaleLowerCase("vi");

// Lịch tiêm của mọi ngựa (hoặc 1 ngựa), NgayHen sớm nhất trước
export async function getVaccinations(horseId) {
  await delay();
  const items = horseId ? vaccineStore.filter((v) => v.HorseID === Number(horseId)) : vaccineStore;
  return items.map((v) => ({ ...v })).sort((a, b) => a.NgayHen.localeCompare(b.NgayHen));
}

// Trả về null nếu không tìm thấy
export async function getVaccinationById(scheduleId) {
  await delay();
  const item = vaccineStore.find((v) => v.ScheduleID === Number(scheduleId));
  return item ? { ...item } : null;
}

// HorseID có lịch tiêm — dùng khi kiểm tra ngựa có dữ liệu liên quan trước khi xóa hồ sơ
export function getHorseIdsWithVaccinations() {
  return new Set(vaccineStore.map((v) => v.HorseID));
}

// Loại trùng gợi ý (không phân biệt hoa thường) → dùng đúng cách viết gợi ý; loại mới → viết hoa chữ cái đầu
function normalizeVaccineType(type) {
  const text = type.trim().replace(/\s+/g, " ");
  return VACCINE_TYPES.find((t) => sameText(t, text)) ?? text.charAt(0).toLocaleUpperCase("vi") + text.slice(1);
}

// Ràng buộc lịch chờ tiêm (BE cũng phải kiểm tra lại): loại 2–50 ký tự; không trùng lịch "Chờ tiêm" cùng ngựa + cùng loại
function assertPendingValid({ HorseID, Loai }, exceptId = null) {
  if (Loai.length < VACCINE_TYPE_LIMITS.min || Loai.length > VACCINE_TYPE_LIMITS.max) throw new Error("Loại không hợp lệ");
  const duplicate = vaccineStore.some(
    (v) => v.ScheduleID !== exceptId && v.HorseID === HorseID && v.TrangThai === VACCINE_PENDING && sameText(v.Loai, Loai)
  );
  if (duplicate) throw new Error(DUPLICATE_PENDING_VACCINE);
}

function findPendingOrThrow(scheduleId) {
  const item = vaccineStore.find((v) => v.ScheduleID === Number(scheduleId));
  if (!item) throw new Error("Không tìm thấy lịch tiêm");
  if (item.TrangThai !== VACCINE_PENDING) throw new Error("Lịch đã tiêm không thể sửa hoặc xóa");
  return item;
}

// Thêm lịch chờ tiêm: NgayHen từ hôm nay trở đi
export async function createVaccination(data) {
  await delay();
  const record = { HorseID: Number(data.HorseID), Loai: normalizeVaccineType(data.Loai), NgayHen: data.NgayHen };
  if (!record.NgayHen || record.NgayHen < todayISO()) throw new Error("Ngày hẹn không được ở quá khứ");
  assertPendingValid(record);
  const item = { ScheduleID: nextVaccineId(), ...record, TrangThai: VACCINE_PENDING };
  vaccineStore.push(item);
  vaccineList.save();
  return { ...item };
}

// Sửa lịch chưa tiêm (không đổi ngựa). Đổi ngày thì ngày mới phải từ hôm nay; giữ nguyên ngày cũ (kể cả đã quá hạn) vẫn được.
export async function updateVaccination(scheduleId, data) {
  await delay();
  const item = findPendingOrThrow(scheduleId);
  const record = { HorseID: item.HorseID, Loai: normalizeVaccineType(data.Loai), NgayHen: data.NgayHen };
  if (!record.NgayHen || (record.NgayHen !== item.NgayHen && record.NgayHen < todayISO())) throw new Error("Ngày hẹn không được ở quá khứ");
  assertPendingValid(record, item.ScheduleID);
  Object.assign(item, record);
  vaccineList.save();
  return { ...item };
}

// Xóa lịch chưa tiêm (nhập nhầm). Lịch đã tiêm không xóa được.
export async function deleteVaccination(scheduleId) {
  await delay();
  const item = findPendingOrThrow(scheduleId);
  vaccineStore.splice(vaccineStore.indexOf(item), 1);
  vaccineList.save();
}

// Đánh dấu đã tiêm; nextDate (tùy chọn, phải sau hôm nay): tạo thêm lịch chờ tiêm cùng ngựa + cùng loại.
// Trả { item, next } — next = lịch mới hoặc null.
export async function markVaccinated(scheduleId, nextDate) {
  await delay();
  const item = findPendingOrThrow(scheduleId);
  if (nextDate && nextDate <= todayISO()) throw new Error("Ngày hẹn lần tiếp theo phải sau hôm nay");
  item.TrangThai = VACCINE_DONE;
  let next = null;
  if (nextDate) {
    assertPendingValid({ HorseID: item.HorseID, Loai: item.Loai });
    next = { ScheduleID: nextVaccineId(), HorseID: item.HorseID, Loai: item.Loai, NgayHen: nextDate, TrangThai: VACCINE_PENDING };
    vaccineStore.push(next);
  }
  vaccineList.save();
  return { item: { ...item }, next: next && { ...next } };
}
