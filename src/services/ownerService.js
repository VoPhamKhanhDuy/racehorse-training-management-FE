import { getActiveTrainingLocks, getVaccinations } from "./vetService";
import { getFeedingPlans, getStableAssignments } from "./careService";
import { getRaceRegistrations, getRaces, getSchedules, getTrainingPlans, getTrainingSessions } from "./trainerService";
import { apiRequest } from "./apiClient";
import { getHealthStatuses, mapHorseFromApi } from "./horseService";

export { getHealthStatuses, getRaceRegistrations, getRaces };

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function formatScheduleLines(items) {
  if (!items?.length) return "";
  return items
    .map((item) => {
      const gio = pick(item, "gio", "Gio") ?? "";
      const congViec = pick(item, "congViec", "CongViec") ?? "";
      return `${gio} ${congViec}`.trim();
    })
    .join("\n");
}

function mapRaceAchievements(items) {
  if (!items?.length) return { entries: [] };
  return {
    entries: items.map((item, index) => {
      const trangThai = pick(item, "trangThai", "TrangThai") ?? "";
      const ngay = pick(item, "ngay", "Ngay") ?? "";
      const tenGiai = pick(item, "tenCuocDua", "TenCuocDua") ?? "";
      let state = "pending";
      let thuHang = null;
      if (trangThai.startsWith("Hạng ")) {
        state = "ranked";
        thuHang = Number.parseInt(trangThai.replace("Hạng ", ""), 10);
      } else if (trangThai === "Sắp diễn ra") {
        state = "upcoming";
      }
      return {
        race: { RaceID: index, Ngay: ngay, TenGiai: tenGiai },
        registration: { ThuHang: thuHang },
        state,
        resultLabel: trangThai,
      };
    }),
  };
}

/** Chi tiết ngựa cho chủ (một API): hồ sơ + chuồng + lịch + khẩu phần + thi đấu. */
export async function getOwnerHorseDetail(horseId) {
  try {
    const raw = await apiRequest(`/owner/horses/${horseId}`);
    if (!raw) return null;

    const lich = pick(raw, "lichSinhHoat", "LichSinhHoat") ?? [];
    const khauPhan = pick(raw, "khauPhan", "KhauPhan") ?? [];
    const thanhTich = pick(raw, "thanhTichThiDau", "ThanhTichThiDau") ?? [];

    const horse = mapHorseFromApi(raw);
    if (horse) {
      horse.NgaySinh = pick(raw, "ngaySinh", "NgaySinh") ?? horse.NgaySinh;
    }

    return {
      horse,
      care: {
        stable: {
          SoChuong: pick(raw, "soChuong", "SoChuong") ?? "",
          LichSinhHoat: formatScheduleLines(lich),
        },
        dietText: khauPhan.length ? khauPhan.join("\n") : "",
        feeding: [],
      },
      achievements: mapRaceAchievements(thanhTich),
    };
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function getOwnerHorses(_ownerId) {
  const data = await apiRequest("/owner/horses");
  return (data ?? [])
    .map(mapHorseFromApi)
    .sort((a, b) => a.Ten.localeCompare(b.Ten, "vi"));
}

export async function getOwnerHorse(_ownerId, horseId) {
  const horses = await getOwnerHorses();
  return horses.find((h) => h.HorseID === Number(horseId)) ?? null;
}

/** Chuồng trên thẻ danh sách — BE chưa trả batch; hiển thị ở trang chi tiết. */
export async function getStableNumbers() {
  return {};
}

export async function getHorseDailyCare(horseId) {
  const detail = await getOwnerHorseDetail(horseId);
  if (detail) return detail.care;
  const id = Number(horseId);
  const [stables, feeding] = await Promise.all([getStableAssignments(), getFeedingPlans()]);
  return { stable: stables.find((s) => s.HorseID === id), feeding: feeding.filter((f) => f.HorseID === id) };
}

export async function getActiveLockDates(horseIds) {
  const ids = new Set(horseIds.map(Number));
  const locks = await getActiveTrainingLocks();
  return Object.fromEntries(
    locks.filter((l) => ids.has(l.HorseID)).map((l) => [l.HorseID, { HorseID: l.HorseID, NgayDat: l.NgayDat, NgayGo: l.NgayGo }])
  );
}

export async function getOwnerVaccinations(horseIds) {
  const ids = new Set(horseIds.map(Number));
  const items = await getVaccinations();
  return items.filter((v) => ids.has(v.HorseID));
}

export async function getOwnerTrainingOverview(horseIds) {
  const ids = new Set(horseIds.map(Number));
  const [schedules, plans, sessions] = await Promise.all([getSchedules(), getTrainingPlans(), getTrainingSessions()]);
  return {
    schedules: schedules.filter((s) => ids.has(s.HorseID)),
    plans: plans.filter((p) => ids.has(p.HorseID)),
    sessions: sessions.filter((s) => ids.has(s.HorseID)),
  };
}

export async function getLockedHorseIds() {
  const locks = await getActiveTrainingLocks();
  return new Set(locks.map((l) => l.HorseID));
}
