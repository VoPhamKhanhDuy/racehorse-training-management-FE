// Flow 5: giải đua, đăng ký, thứ hạng và tiền thưởng trên /api/races.
import { apiRequest } from "./apiClient";
import { notifyApprovalUpdate } from "./approvalUpdates";
import { isoDatePart } from "../utils/date";
import { pick } from "../utils/object";

function asRank(value) {
  if (value === undefined || value === null || value === "") return null;
  const rank = Number(value);
  return Number.isFinite(rank) ? rank : null;
}

function asMoney(value) {
  if (value === undefined || value === null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function mapRace(raw) {
  return {
    RaceID: Number(pick(raw, "raceID", "RaceID")),
    TenGiai: pick(raw, "tenGiai", "TenGiai") ?? "",
    Ngay: isoDatePart(pick(raw, "ngay", "Ngay")),
    DiaDiem: pick(raw, "diaDiem", "DiaDiem") ?? "",
    registrationDeadline: isoDatePart(pick(raw, "registrationDeadline", "RegistrationDeadline")),
    entryFee: asMoney(pick(raw, "entryFee", "EntryFee")),
    // Tổng số ngựa tối đa của giải (nhiều CLB); null hoặc 0 = không giới hạn
    maxParticipants: asRank(pick(raw, "maxParticipants", "MaxParticipants")),
    status: pick(raw, "status", "Status"),
    distanceMeters: asRank(pick(raw, "distanceMeters", "DistanceMeters")),
    prizePool: asMoney(pick(raw, "prizePool", "PrizePool")),
    // Giải thưởng theo hạng; giải cũ để null
    prizeFirst: asMoney(pick(raw, "prizeFirst", "PrizeFirst")),
    prizeSecond: asMoney(pick(raw, "prizeSecond", "PrizeSecond")),
    prizeThird: asMoney(pick(raw, "prizeThird", "PrizeThird")),
    description: pick(raw, "description", "Description") ?? "",
  };
}

function mapRegistration(raw) {
  return {
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    RaceID: Number(pick(raw, "raceID", "RaceID")),
    NgayDangKy: isoDatePart(pick(raw, "ngayDangKy", "NgayDangKy")),
    ThuHang: asRank(pick(raw, "thuHang", "ThuHang")),
    TienThuong: asMoney(pick(raw, "tienThuong", "TienThuong")),
  };
}

export async function getRaces() {
  const rows = await apiRequest("/races");
  return (rows ?? []).map(mapRace).sort((a, b) => a.Ngay.localeCompare(b.Ngay));
}

// Quản lý CLB tạo giải: POST /api/races (BE kiểm tra lại các điều kiện; lỗi 400 ném ra kèm message tiếng Việt).
export async function createRace(payload) {
  return mapRace(await apiRequest("/races", { method: "POST", body: payload }));
}

// Quản lý CLB hủy giải (không xóa): POST /api/races/{id}/cancel. Đăng ký đang chờ duyệt của giải bị BE đóng nên báo bảng đăng ký tải lại.
export async function cancelRace(raceId, reason) {
  const race = mapRace(await apiRequest(`/races/${raceId}/cancel`, { method: "POST", body: { reason } }));
  notifyApprovalUpdate("races");
  return race;
}

export async function getRaceRegistrations() {
  const rows = await apiRequest("/races/registrations");
  return (rows ?? []).map(mapRegistration);
}

export async function cancelRaceRegistration(raceId, horseId) {
  await apiRequest(`/races/${raceId}/registrations/${horseId}`, {
    method: "DELETE",
  });
}

export async function updateRaceResult(raceId, horseId, thuHang) {
  const raw = await apiRequest(
    `/races/${raceId}/registrations/${horseId}/result`,
    {
      method: "PUT",
      body: { thuHang },
    },
  );
  return {
    registration: mapRegistration(pick(raw, "registration", "Registration")),
    prizeCleared: Boolean(pick(raw, "prizeCleared", "PrizeCleared")),
  };
}

export async function setRaceRegistrationPrize(raceId, horseId, amount) {
  const saved = await apiRequest(
    `/races/${raceId}/registrations/${horseId}/prize`,
    {
      method: "PUT",
      body: { amount: Number(amount) },
    },
  );
  return mapRegistration(saved);
}

export async function getPrizeAlerts() {
  const rows = await apiRequest("/races/prize-alerts");
  return (rows ?? []).map((raw) => ({
    AlertID: Number(pick(raw, "alertID", "AlertID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    RaceID: Number(pick(raw, "raceID", "RaceID")),
    Ngay: isoDatePart(pick(raw, "ngay", "Ngay")),
  }));
}

export async function dismissPrizeAlert(alertId) {
  await apiRequest(`/races/prize-alerts/${alertId}`, { method: "DELETE" });
}
