// TODO: thay bằng gọi API báo cáo thật khi BE xong (BE nên tổng hợp sẵn, FE chỉ hiển thị)
// Báo cáo snapshot hiện tại cho Club Manager — tính từ các mock service khác nên số liệu
// cập nhật theo thao tác trong phiên (thêm buổi tập, nhập/xuất kho, sửa đơn giá...).
import races from "../data/races";
import raceRegistrations from "../data/raceRegistrations";
import { getHorses } from "./horseService";
import { getSupplies } from "./supplyService";
import { getSchedules, getTrainingSessions } from "./trainerService";
import { todayISO } from "../utils/date";

const TOP_HORSE_COUNT = 6;

// Hiệu suất tập luyện: tổng buổi tập, số ngựa đã thi đấu, tỷ lệ hoàn thành lịch, số buổi tập theo ngựa
export async function getTrainingReport() {
  const [horses, sessions, schedules] = await Promise.all([getHorses(), getTrainingSessions(), getSchedules()]);
  const today = todayISO();

  // Ngựa đã thi đấu: có đăng ký ở giải đã diễn ra (ngày trước hôm nay)
  const pastRaceIds = new Set(races.filter((r) => r.Ngay < today).map((r) => r.RaceID));
  const racedHorseIds = new Set(
    raceRegistrations.filter((reg) => pastRaceIds.has(reg.RaceID)).map((reg) => reg.HorseID)
  );

  // Tỷ lệ hoàn thành lịch tập: lịch đã qua (trước hôm nay) có buổi tập cùng ngựa + cùng ngày.
  // ERD chưa có khóa nối TRAININGSESSION ↔ TRAININGSCHEDULE nên tạm so theo HorseID + Ngay.
  const sessionKeys = new Set(sessions.map((s) => `${s.HorseID}|${s.Ngay}`));
  const pastSchedules = schedules.filter((s) => s.Ngay < today);
  const completedSchedules = pastSchedules.filter((s) => sessionKeys.has(`${s.HorseID}|${s.Ngay}`));

  const countByHorse = sessions.reduce((acc, s) => ({ ...acc, [s.HorseID]: (acc[s.HorseID] ?? 0) + 1 }), {});
  const sessionsByHorse = horses
    .map((h) => ({ name: h.Ten, sessions: countByHorse[h.HorseID] ?? 0 }))
    .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name, "vi"))
    .slice(0, TOP_HORSE_COUNT);

  return {
    totalSessions: sessions.length,
    racedHorseCount: racedHorseIds.size,
    totalHorses: horses.length,
    completedSchedules: completedSchedules.length,
    pastSchedules: pastSchedules.length,
    completionRate: pastSchedules.length ? completedSchedules.length / pastSchedules.length : 0,
    sessionsByHorse,
  };
}

// Tài chính vật tư: giá trị tồn kho = Σ SoLuongTon × DonGia, theo từng vật tư và từng loại
export async function getSupplyFinanceReport() {
  const supplies = await getSupplies();
  const valued = supplies.map((s) => ({ ...s, value: s.SoLuongTon * (s.DonGia ?? 0) }));
  const totalValue = valued.reduce((sum, s) => sum + s.value, 0);

  const valueByTypeMap = valued.reduce((acc, s) => ({ ...acc, [s.Loai]: (acc[s.Loai] ?? 0) + s.value }), {});
  const valueByType = Object.entries(valueByTypeMap)
    .map(([type, value]) => ({ type, value, share: totalValue ? value / totalValue : 0 }))
    .sort((a, b) => b.value - a.value);

  const topSupply = valued.reduce((top, s) => (!top || s.value > top.value ? s : top), null);

  return {
    totalValue,
    supplyCount: supplies.length,
    topSupply: topSupply ? { name: topSupply.TenVatTu, value: topSupply.value } : null,
    valueByType,
  };
}
