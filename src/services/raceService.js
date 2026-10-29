// Flow 5: giải đua, đăng ký, thứ hạng và tiền thưởng trên /api/races.
import { apiRequest } from "./apiClient";

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function asDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

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
    Ngay: asDate(pick(raw, "ngay", "Ngay")),
    DiaDiem: pick(raw, "diaDiem", "DiaDiem") ?? "",
  };
}

function mapRegistration(raw) {
  return {
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    RaceID: Number(pick(raw, "raceID", "RaceID")),
    NgayDangKy: asDate(pick(raw, "ngayDangKy", "NgayDangKy")),
    ThuHang: asRank(pick(raw, "thuHang", "ThuHang")),
    TienThuong: asMoney(pick(raw, "tienThuong", "TienThuong")),
  };
}

export async function getRaces() {
  const rows = await apiRequest("/races");
  return (rows ?? []).map(mapRace).sort((a, b) => a.Ngay.localeCompare(b.Ngay));
}

export async function getRaceRegistrations() {
  const rows = await apiRequest("/races/registrations");
  return (rows ?? []).map(mapRegistration);
}

export async function registerHorseForRace(raceId, horseId) {
  const saved = await apiRequest(`/races/${raceId}/registrations`, {
    method: "POST",
    body: { horseID: Number(horseId) },
  });
  return mapRegistration(saved);
}

export async function cancelRaceRegistration(raceId, horseId) {
  await apiRequest(`/races/${raceId}/registrations/${horseId}`, { method: "DELETE" });
}

export async function updateRaceResult(raceId, horseId, thuHang) {
  const raw = await apiRequest(`/races/${raceId}/registrations/${horseId}/result`, {
    method: "PUT",
    body: { thuHang },
  });
  return {
    registration: mapRegistration(pick(raw, "registration", "Registration")),
    prizeCleared: Boolean(pick(raw, "prizeCleared", "PrizeCleared")),
  };
}

export async function setRaceRegistrationPrize(raceId, horseId, amount) {
  const saved = await apiRequest(`/races/${raceId}/registrations/${horseId}/prize`, {
    method: "PUT",
    body: { amount: Number(amount) },
  });
  return mapRegistration(saved);
}

export async function getPrizeAlerts() {
  const rows = await apiRequest("/races/prize-alerts");
  return (rows ?? []).map((raw) => ({
    AlertID: Number(pick(raw, "alertID", "AlertID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    RaceID: Number(pick(raw, "raceID", "RaceID")),
    Ngay: asDate(pick(raw, "ngay", "Ngay")),
  }));
}

export async function dismissPrizeAlert(alertId) {
  await apiRequest(`/races/prize-alerts/${alertId}`, { method: "DELETE" });
}
