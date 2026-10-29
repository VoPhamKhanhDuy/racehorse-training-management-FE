// Flow 3 gọi API /api/vet. Bệnh án, lệnh khóa và lịch tiêm nằm trên máy chủ.
// HLV trưởng và chủ ngựa đọc khóa tập, ngày khám gần nhất và lịch tiêm qua cùng các hàm này.
import { apiRequest } from "./apiClient";
import { getHealthStatuses, getHorses } from "./horseService";
import { INJURY_SEPARATOR, NO_INJURY, TREATMENT_STATE } from "../data/medicalRecordOptions";

export { getHealthStatuses, getHorses };

const activeLockIds = new Set();
let relatedRequest = null;

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function asDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function rememberLocks(locks) {
  activeLockIds.clear();
  for (const lock of locks) {
    if (!lock.NgayGo) activeLockIds.add(Number(lock.HorseID));
  }
}

function mapRecord(raw) {
  return {
    RecordID: Number(pick(raw, "recordID", "RecordID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    VetID: Number(pick(raw, "vetID", "VetID")),
    Ngay: asDate(pick(raw, "ngay", "Ngay")),
    ChanDoan: pick(raw, "chanDoan", "ChanDoan") ?? "",
    PhacDo: pick(raw, "phacDo", "PhacDo") ?? "",
    ViTriChanThuong: pick(raw, "viTriChanThuong", "ViTriChanThuong") ?? "",
  };
}

function mapLock(raw) {
  if (!raw) return null;
  return {
    LockID: Number(pick(raw, "lockID", "LockID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    VetID: Number(pick(raw, "vetID", "VetID")),
    LyDo: pick(raw, "lyDo", "LyDo") ?? "",
    NgayDat: asDate(pick(raw, "ngayDat", "NgayDat")),
    NgayGo: asDate(pick(raw, "ngayGo", "NgayGo")),
  };
}

function mapVaccine(raw) {
  return {
    ScheduleID: Number(pick(raw, "scheduleID", "ScheduleID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    Loai: pick(raw, "loai", "Loai") ?? "",
    NgayHen: asDate(pick(raw, "ngayHen", "NgayHen")),
    TrangThai: pick(raw, "trangThai", "TrangThai") ?? "",
  };
}

function injuryText(data) {
  if (data.ViTriChanThuong) return data.ViTriChanThuong;
  if (!Array.isArray(data.injuries) || data.injuries.length === 0) return "";
  return data.injuries.includes(NO_INJURY) ? NO_INJURY : data.injuries.join(INJURY_SEPARATOR);
}

async function readOrNull(path) {
  try {
    return await apiRequest(path);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

function loadRelated() {
  if (!relatedRequest) {
    relatedRequest = apiRequest("/vet/related-horse-ids").finally(() => {
      relatedRequest = null;
    });
  }
  return relatedRequest;
}

export async function getMedicalRecords(horseId) {
  const data = await apiRequest("/vet/medical-records", { query: horseId ? { horseId } : undefined });
  return (data ?? []).map(mapRecord);
}

export async function getMedicalRecordById(recordId) {
  const data = await readOrNull(`/vet/medical-records/${recordId}`);
  return data ? mapRecord(data) : null;
}

export async function getLatestExamDate(horseId) {
  const data = await readOrNull(`/vet/horses/${horseId}/latest-exam`);
  if (!data) return null;
  return { HorseID: Number(pick(data, "horseID", "HorseID")), Ngay: asDate(pick(data, "ngay", "Ngay")) };
}

export async function getHorseIdsWithRecords() {
  const data = await loadRelated();
  return new Set(pick(data, "recordHorseIds", "RecordHorseIds") ?? []);
}

export async function getRecentSessionVitals() {
  const data = await apiRequest("/vet/session-vitals");
  return (data ?? []).map((row) => ({
    HorseID: Number(pick(row, "horseID", "HorseID")),
    Ngay: asDate(pick(row, "ngay", "Ngay")),
    NhipTim: Number(pick(row, "nhipTim", "NhipTim") ?? 0),
  }));
}

export async function getVets() {
  const data = await apiRequest("/vet/vets");
  return (data ?? []).map((vet) => ({
    UserID: Number(pick(vet, "userID", "UserID")),
    HoTen: pick(vet, "hoTen", "HoTen") ?? "",
  }));
}

export async function getTrainingLocks() {
  const data = await apiRequest("/vet/training-locks");
  const locks = (data ?? []).map(mapLock);
  rememberLocks(locks);
  return locks;
}

export async function getActiveTrainingLocks() {
  const data = await apiRequest("/vet/training-locks", { query: { activeOnly: true } });
  const locks = (data ?? []).map(mapLock);
  rememberLocks(locks);
  return locks;
}

export function isHorseLocked(horseId) {
  return activeLockIds.has(Number(horseId));
}

export async function getHorseIdsWithLocks() {
  const data = await loadRelated();
  return new Set(pick(data, "lockHorseIds", "LockHorseIds") ?? []);
}

export async function createTrainingLock(data) {
  const lock = mapLock(
    await apiRequest("/vet/training-locks", {
      method: "POST",
      body: {
        horseID: Number(data.HorseID),
        lyDo: data.LyDo,
        ngayDat: data.NgayDat,
      },
    }),
  );
  activeLockIds.add(lock.HorseID);
  return lock;
}

export async function releaseTrainingLock(lockId, newStatus) {
  const lock = mapLock(
    await apiRequest(`/vet/training-locks/${lockId}/release`, {
      method: "POST",
      body: { trangThai: newStatus },
    }),
  );
  activeLockIds.delete(lock.HorseID);
  return lock;
}

export function shouldAutoLock(injuries, trangThai, horseLocked) {
  const hasInjury = injuries.length > 0 && !injuries.includes(NO_INJURY);
  return hasInjury && trangThai === TREATMENT_STATE && !horseLocked;
}

function examBody(data) {
  return {
    horseID: Number(data.HorseID),
    ngay: data.Ngay,
    chanDoan: data.ChanDoan,
    phacDo: data.PhacDo,
    viTriChanThuong: injuryText(data),
    trangThai: data.TrangThai || null,
  };
}

function mapExamResult(raw) {
  return {
    record: mapRecord(pick(raw, "record", "Record")),
    healthUpdated: Boolean(pick(raw, "healthUpdated", "HealthUpdated")),
    lock: mapLock(pick(raw, "lock", "Lock")),
  };
}

export async function createMedicalRecord(data) {
  return mapExamResult(await apiRequest("/vet/medical-records", { method: "POST", body: examBody(data) }));
}

export async function updateMedicalRecord(recordId, data) {
  return mapExamResult(await apiRequest(`/vet/medical-records/${recordId}`, { method: "PUT", body: examBody(data) }));
}

export async function isLatestMedicalRecord(recordId) {
  const data = await readOrNull(`/vet/medical-records/${recordId}/is-latest`);
  return Boolean(pick(data, "isLatest", "IsLatest"));
}

export async function getVaccinations(horseId) {
  const data = await apiRequest("/vet/vaccinations", { query: horseId ? { horseId } : undefined });
  return (data ?? []).map(mapVaccine);
}

export async function getVaccinationById(scheduleId) {
  const data = await readOrNull(`/vet/vaccinations/${scheduleId}`);
  return data ? mapVaccine(data) : null;
}

export async function getHorseIdsWithVaccinations() {
  const data = await loadRelated();
  return new Set(pick(data, "vaccinationHorseIds", "VaccinationHorseIds") ?? []);
}

export async function createVaccination(data) {
  return mapVaccine(
    await apiRequest("/vet/vaccinations", {
      method: "POST",
      body: { horseID: Number(data.HorseID), loai: data.Loai, ngayHen: data.NgayHen },
    }),
  );
}

export async function updateVaccination(scheduleId, data) {
  return mapVaccine(
    await apiRequest(`/vet/vaccinations/${scheduleId}`, {
      method: "PUT",
      body: { horseID: Number(data.HorseID), loai: data.Loai, ngayHen: data.NgayHen },
    }),
  );
}

export async function deleteVaccination(scheduleId) {
  await apiRequest(`/vet/vaccinations/${scheduleId}`, { method: "DELETE" });
}

export async function markVaccinated(scheduleId, nextDate) {
  const data = await apiRequest(`/vet/vaccinations/${scheduleId}/complete`, {
    method: "POST",
    body: { nextDate: nextDate || null },
  });
  const next = pick(data, "next", "Next");
  return {
    item: mapVaccine(pick(data, "item", "Item")),
    next: next ? mapVaccine(next) : null,
  };
}
