import { todayISO } from "./date";
import { NO_RANK, PODIUM_MAX, hasResult } from "./raceResult";

// Thành tích thi đấu của 1 ngựa — tính từ RACEREGISTRATION (ThuHang) nối RACE, không lưu vào HORSE.
// Dùng chung: hồ sơ ngựa của Quản lý CLB, trang "Ngựa của tôi" của Chủ ngựa.
// Trả về:
// - entries: [{ race, registration, state }] mới nhất trước; state: "upcoming" (giải chưa tới) | "pending" (đã qua, chưa
//   có kết quả) | "unranked" (ThuHang = 0) | "ranked" (ThuHang ≥ 1)
// - participated: số giải đã có kết quả; wins: số lần hạng nhất; podiums: số lần vào top 3
export function getHorseAchievements(horseId, races, registrations, today = todayISO()) {
  const entries = registrations
    .filter((r) => r.HorseID === Number(horseId))
    .map((registration) => ({ registration, race: races.find((race) => race.RaceID === registration.RaceID) }))
    .filter((entry) => entry.race)
    .map((entry) => ({ ...entry, state: getEntryState(entry, today) }))
    .sort((a, b) => b.race.Ngay.localeCompare(a.race.Ngay));

  const ranked = entries.filter((e) => e.state === "ranked");
  return {
    entries,
    participated: entries.filter((e) => hasResult(e.registration)).length,
    wins: ranked.filter((e) => e.registration.ThuHang === 1).length,
    podiums: ranked.filter((e) => e.registration.ThuHang <= PODIUM_MAX).length,
  };
}

function getEntryState({ race, registration }, today) {
  if (race.Ngay >= today) return "upcoming";
  if (!hasResult(registration)) return "pending";
  return registration.ThuHang === NO_RANK ? "unranked" : "ranked";
}
