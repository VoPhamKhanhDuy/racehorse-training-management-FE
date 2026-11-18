import { apiRequest } from "./apiClient";
import { getRaceRegistrations, getRaces } from "./raceService";
import { addDays } from "../utils/date";
import { RR_DEADLINE_DAYS_BEFORE, RR_STATUS, ACTION_STATUS_BY_ROLE } from "../utils/raceRegistration";
import { notifyApprovalUpdate, subscribeApprovalUpdates } from "./approvalUpdates";

export const subscribeRaceRegistrations = (callback) => subscribeApprovalUpdates("races", callback);
export const raceRegistrationDeadline = (race) => race.registrationDeadline || addDays(race.Ngay, -RR_DEADLINE_DAYS_BEFORE);

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
    registrationDeadline: raceRegistrationDeadline(race),
    entryFee: race.entryFee,
    note: "",
    trainerName: "",
    status: RR_STATUS.APPROVED,
    rejectedBy: null,
    rejectReason: "",
    createdAt: registration.NgayDangKy ? `${registration.NgayDangKy}T00:00:00` : "",
    history: [],
  };
}

export async function getRaceOptions() {
  return (await getRaces())
    .filter((r) => !["Cancelled", "Canceled", "Đã hủy"].includes(r.status))
    .map((r) => ({ ...r, registrationDeadline: raceRegistrationDeadline(r) }));
}

// Gắn ThuHang / TienThuong từ GET /api/races/registrations; owner có thể thêm bản ghi direct nếu chưa có trong luồng duyệt.
async function attachRaceResults(records, { horseIds = [], horseNameById = {}, includeDirect = false } = {}) {
  const [races, regs] = await Promise.all([getRaces(), getRaceRegistrations()]);
  const ids = new Set(horseIds.map(Number));
  for (const reg of regs) {
    if (ids.size > 0 && !ids.has(Number(reg.HorseID))) continue;
    const match = records.find(
      (r) => Number(r.horseId) === Number(reg.HorseID) && Number(r.raceId) === Number(reg.RaceID)
    );
    if (match) {
      match.thuHang = reg.ThuHang;
      match.tienThuong = reg.TienThuong;
      continue;
    }
    if (!includeDirect) continue;
    const race = races.find((r) => Number(r.RaceID) === Number(reg.RaceID));
    if (!race) continue;
    const name = horseNameById[reg.HorseID] ?? horseNameById[Number(reg.HorseID)] ?? `Ngựa #${reg.HorseID}`;
    const direct = buildDirectRegistration(race, reg, name);
    direct.thuHang = reg.ThuHang;
    direct.tienThuong = reg.TienThuong;
    records.push(direct);
  }
  return records;
}

// Role/ownership lọc trên BE qua JWT. Owner: gộp thêm kết quả thật từ /api/races/registrations.
export async function listRaceRegistrations(role, opts = {}) {
  const raw = await apiRequest("/approvals/races");
  const list = Array.isArray(raw) ? [...raw] : [];
  if (role === "horse_owner") {
    try {
      await attachRaceResults(list, { ...opts, includeDirect: true });
    } catch {
      // vẫn trả danh sách duyệt nếu không tải được kết quả
    }
  }
  return list;
}

export const getRaceRegistration = (id) => apiRequest(`/approvals/races/${id}`);

async function mutate(path, body) {
  const record = await apiRequest(`/approvals/races${path}`, { method: "POST", body });
  notifyApprovalUpdate("races");
  return record;
}
export function createRaceRegistration({ horse, race, note }) {
  if (!horse || !race) throw new Error("Vui lòng chọn ngựa và cuộc đua.");
  return mutate("", { horseId: Number(horse.horseId), raceId: Number(race.RaceID), note });
}
export const submitRaceRegistration = (id) => mutate(`/${id}/submit`);
export const withdrawRaceRegistration = (id) => mutate(`/${id}/withdraw`);
export const ownerDecideRaceRegistration = (id, decision) => mutate(`/${id}/decision`, decision);
export const managerDecideRaceRegistration = ownerDecideRaceRegistration;
export async function markRaceRegistrationSeen(id) {
  await apiRequest(`/approvals/races/${id}/seen`, { method: "POST" });
  notifyApprovalUpdate("races");
}

export async function countRaceRegistrationsWaiting(role) {
  const list = await listRaceRegistrations(role);
  return list.filter((r) =>
    role === "head_trainer"
      ? [RR_STATUS.APPROVED, RR_STATUS.REJECTED].includes(r.status) && !r.trainerSeen
      : r.status === ACTION_STATUS_BY_ROLE[role]
  ).length;
}
export async function getOwnerApprovedRaces(_horseIds, { from, to }) {
  return (await listRaceRegistrations("horse_owner"))
    .filter((r) => r.status === RR_STATUS.APPROVED && r.raceDate >= from && r.raceDate <= to)
    .map((r) => ({ key: `rr${r.id}`, horseId: r.horseId, date: r.raceDate, name: r.raceName, location: r.raceLocation }));
}
