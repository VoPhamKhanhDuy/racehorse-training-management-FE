// TODO: thay bằng gọi API thật khi BE xong
// Mock API cho Chủ ngựa — CHỈ XEM. Đọc lại các kho dùng chung (hồ sơ ngựa, sức khỏe, khóa tập, phân chuồng, thi đấu)
// nên thấy ngay thay đổi của Quản lý CLB / bác sĩ thú y / HLV trong cùng phiên.
// Riêng khóa tập: chỉ trả về ngựa nào đang bị khóa, KHÔNG trả lý do / chẩn đoán y tế cho chủ ngựa.
import { getHealthStatuses, getHorses } from "./horseService";
import { getActiveTrainingLocks, getVaccinations } from "./vetService";
import { getFeedingPlans, getStableAssignments, getStableNumbers } from "./careService";
import { getRaceRegistrations, getRaces, getSchedules, getTrainingPlans, getTrainingSessions } from "./trainerService";

export { getHealthStatuses, getRaceRegistrations, getRaces, getStableNumbers };

// Chăm sóc hằng ngày của 1 ngựa (chỉ xem): { stable: STABLEASSIGNMENT | undefined, feeding: FEEDINGPLAN[] }
export async function getHorseDailyCare(horseId) {
  const id = Number(horseId);
  const [stables, feeding] = await Promise.all([getStableAssignments(), getFeedingPlans()]);
  return { stable: stables.find((s) => s.HorseID === id), feeding: feeding.filter((f) => f.HorseID === id) };
}

// Lệnh khóa tập đang hiệu lực của các ngựa — CHỈ trả HorseID, NgayDat, NgayGo (đủ để tính số ngày bằng getLockDays),
// KHÔNG trả LyDo / VetID cho chủ ngựa. { [HorseID]: { HorseID, NgayDat, NgayGo } }
export async function getActiveLockDates(horseIds) {
  const ids = new Set(horseIds.map(Number));
  const locks = await getActiveTrainingLocks();
  return Object.fromEntries(
    locks.filter((l) => ids.has(l.HorseID)).map((l) => [l.HorseID, { HorseID: l.HorseID, NgayDat: l.NgayDat, NgayGo: l.NgayGo }])
  );
}

// Lịch tiêm (VACCINATIONSCHEDULE) của các ngựa, NgayHen sớm nhất trước
export async function getOwnerVaccinations(horseIds) {
  const ids = new Set(horseIds.map(Number));
  const items = await getVaccinations();
  return items.filter((v) => ids.has(v.HorseID));
}

// Dữ liệu trang Lịch trình của các ngựa (chỉ xem; KHÔNG kèm nhịp tim, vận tốc, chi tiết giáo án):
// { schedules: TRAININGSCHEDULE[], plans: TRAININGPLAN[] (PlanID mới → cũ), sessions: TRAININGSESSION[] (mới → cũ) }
export async function getOwnerTrainingOverview(horseIds) {
  const ids = new Set(horseIds.map(Number));
  const [schedules, plans, sessions] = await Promise.all([getSchedules(), getTrainingPlans(), getTrainingSessions()]);
  return {
    schedules: schedules.filter((s) => ids.has(s.HorseID)),
    plans: plans.filter((p) => ids.has(p.HorseID)),
    sessions: sessions.filter((s) => ids.has(s.HorseID)),
  };
}

// Ngựa của 1 chủ (HORSE.OwnerID = ownerId), sắp theo tên
export async function getOwnerHorses(ownerId) {
  const horses = await getHorses();
  return horses.filter((h) => h.OwnerID === Number(ownerId)).sort((a, b) => a.Ten.localeCompare(b.Ten, "vi"));
}

// 1 ngựa của chủ: null nếu không tồn tại hoặc không thuộc chủ này (chủ ngựa chỉ xem được ngựa của mình)
export async function getOwnerHorse(ownerId, horseId) {
  const horses = await getOwnerHorses(ownerId);
  return horses.find((h) => h.HorseID === Number(horseId)) ?? null;
}

// Tập HorseID đang tạm ngưng huấn luyện (TRAININGLOCK chưa gỡ) — không kèm LyDo
export async function getLockedHorseIds() {
  const locks = await getActiveTrainingLocks();
  return new Set(locks.map((l) => l.HorseID));
}
