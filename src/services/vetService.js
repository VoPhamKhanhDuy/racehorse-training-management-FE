// Dịch vụ Bác sĩ thú y (Flow 3): nối API thật (/api/medical/* và /api/horses/*) đồng thời đồng bộ kho localStorage
// để giữ nguyên 100% giao diện nguyên mẫu FE và hỗ trợ mọi role (Vet / Owner / Trainer / Manager) đọc dữ liệu trực tiếp từ DB.
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
import { apiRequest } from "./apiClient";
import { createPersistedList } from "./persistedStore";
import { getHealthStatuses, getHorses, updateHealthStatus } from "./horseService";
import { toUserID } from "../utils/userId";
import { todayISO } from "../utils/date";

// Ngựa + tình trạng sức khỏe dùng chung kho với các màn khác
export { getHealthStatuses, getHorses };

const NETWORK_DELAY_MS = 200;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function shouldFallbackToLocal(err) {
  return (
    err?.code === "NO_API_SESSION"
    || err?.code === "NETWORK_ERROR"
    || err?.status === 401
    || err?.status === 403
  );
}

/**
 * Thử gọi endpoint /medical/... (dành cho Bác sĩ thú y); nếu bị 403 (khi đang đăng nhập bằng role
 * HLV trưởng, Chủ ngựa hoặc Quản lý CLB), tự động đọc qua endpoint dùng chung /horses/... trên Backend.
 */
async function requestMedicalOrShared(medicalPath, sharedPath) {
  try {
    return await apiRequest(medicalPath);
  } catch (err) {
    if (err?.status === 403 && sharedPath) {
      return await apiRequest(sharedPath);
    }
    throw err;
  }
}

// Lưu bền: SEED + lớp thay đổi trong localStorage (services/persistedStore.js)
const recordList = createPersistedList("medicalRecords", medicalRecords, "RecordID");
const recordStore = recordList.items;

// Mới nhất trước: theo Ngay, cùng ngày thì bản ghi tạo sau trước
const byNewest = (a, b) => b.Ngay.localeCompare(a.Ngay) || b.RecordID - a.RecordID;

function mapRecordFromApi(raw) {
  if (!raw) return null;
  return {
    RecordID: Number(pick(raw, "RecordID", "recordID", "recordId", "RecordId") ?? 0),
    HorseID: Number(pick(raw, "HorseID", "horseID", "horseId", "HorseId") ?? 0),
    VetID: Number(pick(raw, "VetID", "vetID", "vetId", "VetId") ?? 0),
    Ngay: pick(raw, "Ngay", "ngay") ?? "",
    ChanDoan: pick(raw, "ChanDoan", "chanDoan") ?? "",
    PhacDo: pick(raw, "PhacDo", "phacDo") ?? "",
    ViTriChanThuong: pick(raw, "ViTriChanThuong", "viTriChanThuong") ?? NO_INJURY,
  };
}

function upsertRecordInStore(record) {
  if (!record || !record.RecordID) return;
  const idx = recordStore.findIndex((r) => r.RecordID === Number(record.RecordID));
  if (idx >= 0) recordStore[idx] = { ...record };
  else recordStore.push({ ...record });
}

function syncRecordsToStore(records, horseId = null) {
  if (!Array.isArray(records)) return;
  if (!horseId) {
    recordStore.splice(0, recordStore.length, ...records.map((r) => ({ ...r })));
  } else {
    const hid = Number(horseId);
    const others = recordStore.filter((r) => r.HorseID !== hid);
    recordStore.splice(0, recordStore.length, ...others, ...records.map((r) => ({ ...r })));
  }
  recordList.save();
}

// Danh sách bệnh án (mới nhất trước); horseId để lọc 1 ngựa
export async function getMedicalRecords(horseId) {
  try {
    const query = horseId ? `?horseId=${Number(horseId)}` : "";
    const data = await apiRequest(`/medical/records${query}`);
    const mapped = (data ?? []).map(mapRecordFromApi).filter(Boolean).sort(byNewest);
    syncRecordsToStore(mapped, horseId);
    return mapped;
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const records = horseId ? recordStore.filter((r) => r.HorseID === Number(horseId)) : recordStore;
    return records.map((r) => ({ ...r })).sort(byNewest);
  }
}

// Trả về null nếu không tìm thấy
export async function getMedicalRecordById(recordId) {
  try {
    const data = await apiRequest(`/medical/records/${Number(recordId)}`);
    const mapped = mapRecordFromApi(data);
    if (mapped) {
      upsertRecordInStore(mapped);
      recordList.save();
    }
    return mapped;
  } catch (err) {
    if (err?.status === 404) return null;
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const record = recordStore.find((r) => r.RecordID === Number(recordId));
    return record ? { ...record } : null;
  }
}

// Ngày khám gần nhất của 1 ngựa — CHỈ trả HorseID + Ngay (dùng cho HLV trưởng, không lộ chẩn đoán/phác đồ)
export async function getLatestExamDate(horseId) {
  try {
    const hid = Number(horseId);
    const data = await requestMedicalOrShared(
      `/medical/records/latest-exam/${hid}`,
      `/horses/${hid}/latest-exam`
    );
    if (!data) return null;
    const ngay = pick(data, "Ngay", "ngay");
    return ngay ? { HorseID: Number(pick(data, "HorseID", "horseID", "horseId") ?? hid), Ngay: ngay } : null;
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const latest = recordStore
      .filter((r) => r.HorseID === Number(horseId))
      .reduce((max, r) => (r.Ngay > max ? r.Ngay : max), "");
    return latest ? { HorseID: Number(horseId), Ngay: latest } : null;
  }
}

// HorseID có bệnh án — dùng khi kiểm tra ngựa có dữ liệu liên quan trước khi xóa hồ sơ
export function getHorseIdsWithRecords() {
  return new Set(recordStore.map((r) => r.HorseID));
}

// Bác sĩ thú y (roleId "veterinarian") theo field ERD — hiện tên "BS. ..." trong sổ khám bệnh
export async function getVets() {
  const accounts = await getAccountUsers();
  const localVets = accounts
    .filter((u) => u.roleId === "veterinarian")
    .map((u) => ({ UserID: toUserID(u.id), HoTen: u.fullName }));

  try {
    const apiVets = await requestMedicalOrShared("/medical/vets", "/horses/vets");
    const mapped = (apiVets ?? []).map((u) => ({
      UserID: Number(pick(u, "UserID", "userID", "userId", "UserId") ?? 0),
      HoTen: pick(u, "HoTen", "hoTen", "fullName", "FullName") ?? "",
    }));
    const byId = new Map(localVets.map((v) => [v.UserID, v]));
    mapped.forEach((v) => {
      if (v.UserID) byId.set(v.UserID, v);
    });
    return Array.from(byId.values());
  } catch {
    return localVets;
  }
}

// ---- Lệnh khóa huấn luyện (TRAININGLOCK) ----
// Kho dùng chung cho mọi role: HLV trưởng đọc qua trainerService để chặn xếp lịch / ghi buổi tập / đăng ký thi đấu.
const lockList = createPersistedList("trainingLocks", trainingLocks, "LockID");
const lockStore = lockList.items;

function mapLockFromApi(raw) {
  if (!raw) return null;
  return {
    LockID: Number(pick(raw, "LockID", "lockID", "lockId", "LockId") ?? 0),
    HorseID: Number(pick(raw, "HorseID", "horseID", "horseId", "HorseId") ?? 0),
    VetID: Number(pick(raw, "VetID", "vetID", "vetId", "VetId") ?? 0),
    LyDo: pick(raw, "LyDo", "lyDo") ?? "",
    NgayDat: pick(raw, "NgayDat", "ngayDat") ?? "",
    NgayGo: pick(raw, "NgayGo", "ngayGo") ?? null,
  };
}

function upsertLockInStore(lock) {
  if (!lock || !lock.LockID) return;
  const idx = lockStore.findIndex((l) => l.LockID === Number(lock.LockID));
  if (idx >= 0) lockStore[idx] = { ...lock };
  else lockStore.push({ ...lock });
}

// Mọi lệnh khóa huấn luyện, kể cả đã gỡ (ngăn chi tiết bệnh án tìm lệnh khóa đặt cùng ngày khám)
export async function getTrainingLocks() {
  try {
    const data = await requestMedicalOrShared("/medical/training-locks", "/horses/training-locks");
    const mapped = (data ?? []).map(mapLockFromApi).filter(Boolean);
    lockStore.splice(0, lockStore.length, ...mapped.map((l) => ({ ...l })));
    lockList.save();
    return mapped;
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    return lockStore.map((l) => ({ ...l }));
  }
}

// Lệnh khóa huấn luyện đang hiệu lực (TRAININGLOCK chưa gỡ)
export async function getActiveTrainingLocks() {
  try {
    const data = await requestMedicalOrShared(
      "/medical/training-locks/active",
      "/horses/training-locks/active"
    );
    const mapped = (data ?? []).map(mapLockFromApi).filter(Boolean);
    const activeIds = new Set(mapped.map((l) => l.LockID));
    // Đồng bộ trạng thái hiệu lực vào lockStore để các màn khác đọc chuẩn xác
    lockStore.forEach((l) => {
      if (!l.NgayGo && !activeIds.has(l.LockID)) {
        l.NgayGo = todayISO();
      }
    });
    mapped.forEach(upsertLockInStore);
    lockList.save();
    return mapped;
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    return lockStore.filter((l) => !l.NgayGo).map((l) => ({ ...l }));
  }
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
  const horseId = Number(data.HorseID);
  const reason = data.LyDo.trim().replace(/\s+/g, " ");
  if (isHorseLocked(horseId)) throw new Error("Ngựa này đang có lệnh khóa huấn luyện hiệu lực");
  if (!data.NgayDat || data.NgayDat > todayISO()) throw new Error("Ngày đặt không được ở tương lai");
  if (reason.length < LOCK_REASON_LIMITS.min || reason.length > LOCK_REASON_LIMITS.max) throw new Error("Lý do không hợp lệ");

  try {
    const created = await apiRequest("/medical/training-locks", {
      method: "POST",
      body: {
        HorseID: horseId,
        LyDo: reason,
        NgayDat: data.NgayDat,
      },
    });
    const mapped = mapLockFromApi(created);
    upsertLockInStore(mapped);
    lockList.save();
    await getHealthStatuses();
    return { ...mapped };
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const lock = { LockID: nextLockId(), HorseID: horseId, VetID: Number(vetId), LyDo: reason, NgayDat: data.NgayDat, NgayGo: null };
    lockStore.push(lock);
    lockList.save();
    const health = (await getHealthStatuses()).find((h) => h.HorseID === horseId);
    if (health?.TrangThai !== TREATMENT_STATE) await updateHealthStatus(horseId, TREATMENT_STATE, todayISO());
    return { ...lock };
  }
}

// Gỡ lệnh khóa (không xóa — giữ lịch sử): NgayGo = hôm nay; tình trạng sức khỏe mới do bác sĩ chọn
// ("Cần theo dõi" | "Tốt", NgayCapNhat = hôm nay). Trả lệnh khóa sau khi gỡ.
export async function releaseTrainingLock(lockId, newStatus) {
  if (!RELEASE_HEALTH_STATES.includes(newStatus)) throw new Error("Vui lòng chọn tình trạng sức khỏe mới");

  try {
    const released = await apiRequest(`/medical/training-locks/${Number(lockId)}/release`, {
      method: "POST",
      body: { newStatus },
    });
    const mapped = mapLockFromApi(released);
    upsertLockInStore(mapped);
    lockList.save();
    await getHealthStatuses();
    return { ...mapped };
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const lock = lockStore.find((l) => l.LockID === Number(lockId));
    if (!lock) throw new Error("Không tìm thấy lệnh khóa");
    if (lock.NgayGo) throw new Error("Lệnh khóa này đã được gỡ");
    lock.NgayGo = todayISO();
    lockList.save();
    await updateHealthStatus(lock.HorseID, newStatus, lock.NgayGo);
    return { ...lock };
  }
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
  const record = toRecord(data);
  assertRecordValid(record, data.injuries);

  try {
    const res = await apiRequest("/medical/records", {
      method: "POST",
      body: {
        HorseID: record.HorseID,
        Ngay: record.Ngay,
        ChanDoan: record.ChanDoan,
        PhacDo: record.PhacDo,
        injuries: data.injuries,
        Injuries: data.injuries,
        TrangThai: data.TrangThai || null,
      },
    });
    const savedRecord = mapRecordFromApi(pick(res, "record", "Record"));
    const healthUpdated = Boolean(pick(res, "healthUpdated", "HealthUpdated"));
    const createdLock = mapLockFromApi(pick(res, "lock", "Lock"));

    if (savedRecord) {
      upsertRecordInStore(savedRecord);
      recordList.save();
    }
    if (createdLock) {
      upsertLockInStore(createdLock);
      lockList.save();
    }
    if (healthUpdated || createdLock) {
      await getHealthStatuses();
    }
    return { record: savedRecord, healthUpdated, lock: createdLock };
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const newRecord = { RecordID: recordStore.reduce((max, r) => Math.max(max, r.RecordID), 0) + 1, VetID: Number(vetId), ...record };
    recordStore.push(newRecord);
    recordList.save();
    const healthUpdated = data.TrangThai ? await updateHealthStatus(record.HorseID, data.TrangThai, record.Ngay) : false;
    const lock = autoLockIfNeeded(newRecord, data.injuries, data.TrangThai, vetId);
    return { record: { ...newRecord }, healthUpdated, lock };
  }
}

// Sửa bệnh án — chỉ bác sĩ đã ghi (VetID) được sửa, không đổi ngựa. Bệnh án KHÔNG có thao tác xóa.
export async function updateMedicalRecord(recordId, data, vetId) {
  const record = toRecord(data);
  assertRecordValid(record, data.injuries);

  try {
    const res = await apiRequest(`/medical/records/${Number(recordId)}`, {
      method: "PUT",
      body: {
        HorseID: record.HorseID,
        Ngay: record.Ngay,
        ChanDoan: record.ChanDoan,
        PhacDo: record.PhacDo,
        injuries: data.injuries,
        Injuries: data.injuries,
        TrangThai: data.TrangThai || null,
      },
    });
    const savedRecord = mapRecordFromApi(pick(res, "record", "Record"));
    const healthUpdated = Boolean(pick(res, "healthUpdated", "HealthUpdated"));
    const createdLock = mapLockFromApi(pick(res, "lock", "Lock"));

    if (savedRecord) {
      upsertRecordInStore(savedRecord);
      recordList.save();
    }
    if (createdLock) {
      upsertLockInStore(createdLock);
      lockList.save();
    }
    if (healthUpdated || createdLock) {
      await getHealthStatuses();
    }
    return { record: savedRecord, healthUpdated, lock: createdLock };
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const current = recordStore.find((r) => r.RecordID === Number(recordId));
    if (!current) throw new Error("Không tìm thấy bệnh án");
    if (current.VetID !== Number(vetId)) throw new Error("Bạn chỉ được sửa bệnh án do chính mình ghi");
    const updatedRecord = { ...record, HorseID: current.HorseID };
    Object.assign(current, updatedRecord);
    recordList.save();
    const canUpdateHealth = data.TrangThai && isLatestRecordOfHorse(current);
    const healthUpdated = canUpdateHealth ? await updateHealthStatus(current.HorseID, data.TrangThai, current.Ngay) : false;
    const lock = canUpdateHealth ? autoLockIfNeeded(current, data.injuries, data.TrangThai, vetId) : null;
    return { record: { ...current }, healthUpdated, lock };
  }
}

// Bản ghi đang sửa có phải lần khám mới nhất của ngựa không (form sửa chỉ hiện ô tình trạng khi đúng)
export async function isLatestMedicalRecord(recordId) {
  try {
    const res = await apiRequest(`/medical/records/${Number(recordId)}/is-latest`);
    return Boolean(res);
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay(0);
    const record = recordStore.find((r) => r.RecordID === Number(recordId));
    return Boolean(record) && isLatestRecordOfHorse(record);
  }
}

// ---- Lịch tiêm phòng / tẩy giun (VACCINATIONSCHEDULE) ----
// Kho dùng chung: HLV trưởng đọc qua trainerService (hồ sơ ngựa), kiểm tra xóa ngựa đọc getHorseIdsWithVaccinations.
// TrangThai chỉ lưu "Chờ tiêm" | "Đã tiêm"; "Quá hạn" / "Sắp tới" tính bằng getVaccineState (utils/healthAlerts.js).
const vaccineList = createPersistedList("vaccinations", vaccinations, "ScheduleID");
const vaccineStore = vaccineList.items;
const nextVaccineId = () => vaccineStore.reduce((max, v) => Math.max(max, v.ScheduleID), 0) + 1;
const sameText = (a, b) => a.toLocaleLowerCase("vi") === b.toLocaleLowerCase("vi");

function mapVaccineFromApi(raw) {
  if (!raw) return null;
  return {
    ScheduleID: Number(pick(raw, "ScheduleID", "scheduleID", "scheduleId", "ScheduleId") ?? 0),
    HorseID: Number(pick(raw, "HorseID", "horseID", "horseId", "HorseId") ?? 0),
    Loai: pick(raw, "Loai", "loai") ?? "",
    NgayHen: pick(raw, "NgayHen", "ngayHen") ?? "",
    TrangThai: pick(raw, "TrangThai", "trangThai") ?? VACCINE_PENDING,
    GhiChu: pick(raw, "GhiChu", "ghiChu") ?? null,
  };
}

function upsertVaccineInStore(item) {
  if (!item || !item.ScheduleID) return;
  const idx = vaccineStore.findIndex((v) => v.ScheduleID === Number(item.ScheduleID));
  if (idx >= 0) vaccineStore[idx] = { ...item };
  else vaccineStore.push({ ...item });
}

function syncVaccinesToStore(items, horseId = null) {
  if (!Array.isArray(items)) return;
  if (!horseId) {
    vaccineStore.splice(0, vaccineStore.length, ...items.map((v) => ({ ...v })));
  } else {
    const hid = Number(horseId);
    const others = vaccineStore.filter((v) => v.HorseID !== hid);
    vaccineStore.splice(0, vaccineStore.length, ...others, ...items.map((v) => ({ ...v })));
  }
  vaccineList.save();
}

// Lịch tiêm của mọi ngựa (hoặc 1 ngựa), NgayHen sớm nhất trước
export async function getVaccinations(horseId) {
  try {
    const query = horseId ? `?horseId=${Number(horseId)}` : "";
    const data = await requestMedicalOrShared(
      `/medical/vaccinations${query}`,
      `/horses/vaccinations${query}`
    );
    const mapped = (data ?? [])
      .map(mapVaccineFromApi)
      .filter(Boolean)
      .sort((a, b) => a.NgayHen.localeCompare(b.NgayHen));
    syncVaccinesToStore(mapped, horseId);
    return mapped;
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const items = horseId ? vaccineStore.filter((v) => v.HorseID === Number(horseId)) : vaccineStore;
    return items.map((v) => ({ ...v })).sort((a, b) => a.NgayHen.localeCompare(b.NgayHen));
  }
}

// Trả về null nếu không tìm thấy
export async function getVaccinationById(scheduleId) {
  try {
    const data = await apiRequest(`/medical/vaccinations/${Number(scheduleId)}`);
    const mapped = mapVaccineFromApi(data);
    if (mapped) {
      upsertVaccineInStore(mapped);
      vaccineList.save();
    }
    return mapped;
  } catch (err) {
    if (err?.status === 404) return null;
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const item = vaccineStore.find((v) => v.ScheduleID === Number(scheduleId));
    return item ? { ...item } : null;
  }
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
  const record = { HorseID: Number(data.HorseID), Loai: normalizeVaccineType(data.Loai), NgayHen: data.NgayHen };
  if (!record.NgayHen || record.NgayHen < todayISO()) throw new Error("Ngày hẹn không được ở quá khứ");
  if (record.Loai.length < VACCINE_TYPE_LIMITS.min || record.Loai.length > VACCINE_TYPE_LIMITS.max) {
    throw new Error("Loại không hợp lệ");
  }

  try {
    const created = await apiRequest("/medical/vaccinations", {
      method: "POST",
      body: record,
    });
    const mapped = mapVaccineFromApi(created);
    upsertVaccineInStore(mapped);
    vaccineList.save();
    return { ...mapped };
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    assertPendingValid(record);
    const item = { ScheduleID: nextVaccineId(), ...record, TrangThai: VACCINE_PENDING };
    vaccineStore.push(item);
    vaccineList.save();
    return { ...item };
  }
}

// Sửa lịch chưa tiêm (không đổi ngựa). Đổi ngày thì ngày mới phải từ hôm nay; giữ nguyên ngày cũ (kể cả đã quá hạn) vẫn được.
export async function updateVaccination(scheduleId, data) {
  const localItem = vaccineStore.find((v) => v.ScheduleID === Number(scheduleId));
  const horseId = Number(data.HorseID || localItem?.HorseID || 0);
  const record = { HorseID: horseId, Loai: normalizeVaccineType(data.Loai), NgayHen: data.NgayHen };
  if (record.Loai.length < VACCINE_TYPE_LIMITS.min || record.Loai.length > VACCINE_TYPE_LIMITS.max) {
    throw new Error("Loại không hợp lệ");
  }

  try {
    const updated = await apiRequest(`/medical/vaccinations/${Number(scheduleId)}`, {
      method: "PUT",
      body: record,
    });
    const mapped = mapVaccineFromApi(updated);
    upsertVaccineInStore(mapped);
    vaccineList.save();
    return { ...mapped };
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const item = findPendingOrThrow(scheduleId);
    if (!record.NgayHen || (record.NgayHen !== item.NgayHen && record.NgayHen < todayISO())) {
      throw new Error("Ngày hẹn không được ở quá khứ");
    }
    assertPendingValid({ HorseID: item.HorseID, Loai: record.Loai }, item.ScheduleID);
    Object.assign(item, { Loai: record.Loai, NgayHen: record.NgayHen });
    vaccineList.save();
    return { ...item };
  }
}

// Xóa lịch chưa tiêm (nhập nhầm). Lịch đã tiêm không xóa được.
export async function deleteVaccination(scheduleId) {
  try {
    await apiRequest(`/medical/vaccinations/${Number(scheduleId)}`, {
      method: "DELETE",
    });
    const idx = vaccineStore.findIndex((v) => v.ScheduleID === Number(scheduleId));
    if (idx >= 0) {
      vaccineStore.splice(idx, 1);
      vaccineList.save();
    }
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const item = findPendingOrThrow(scheduleId);
    vaccineStore.splice(vaccineStore.indexOf(item), 1);
    vaccineList.save();
  }
}

// Đánh dấu đã tiêm; nextDate (tùy chọn, phải sau hôm nay): tạo thêm lịch chờ tiêm cùng ngựa + cùng loại.
// Trả { item, next } — next = lịch mới hoặc null.
export async function markVaccinated(scheduleId, nextDate) {
  if (nextDate && nextDate <= todayISO()) throw new Error("Ngày hẹn lần tiếp theo phải sau hôm nay");

  try {
    const res = await apiRequest(`/medical/vaccinations/${Number(scheduleId)}/mark-done`, {
      method: "POST",
      body: { nextDate: nextDate || null, NextDate: nextDate || null },
    });
    const item = mapVaccineFromApi(pick(res, "item", "Item"));
    const next = mapVaccineFromApi(pick(res, "next", "Next"));
    if (item) upsertVaccineInStore(item);
    if (next) upsertVaccineInStore(next);
    vaccineList.save();
    return { item: item && { ...item }, next: next && { ...next } };
  } catch (err) {
    if (!shouldFallbackToLocal(err)) throw err;
    await delay();
    const item = findPendingOrThrow(scheduleId);
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
}
