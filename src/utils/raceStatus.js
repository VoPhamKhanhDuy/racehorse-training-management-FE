import { formatCurrency } from "./currency";

// "Nhất: 100.000.000 ₫ · Nhì: ... · Ba: ..." chỉ gồm các hạng có nhập; giải cũ không có hạng nào → undefined
export function rankPrizeText(race) {
  const parts = [
    ["Nhất", race?.prizeFirst],
    ["Nhì", race?.prizeSecond],
    ["Ba", race?.prizeThird],
  ]
    .filter(([, amount]) => amount != null)
    .map(([name, amount]) => `${name}: ${formatCurrency(amount)}`);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

// Trạng thái hiển thị của giải đua (bảng giải của quản lý). Status của BE: Open / Cancelled (Canceled, "Đã hủy" là dữ liệu cũ).
const CANCELLED = ["Cancelled", "Canceled", "Đã hủy"];

export const isCancelledRace = (race) => CANCELLED.includes(race?.status);

// Giải còn hủy được ở phía giao diện: chưa hủy và chưa diễn ra (BE kiểm tra lại, kể cả "đã có kết quả")
export const canCancelRace = (race, today) => !isCancelledRace(race) && race.Ngay >= today;

export function raceStatusLabel(race, today) {
  if (isCancelledRace(race)) return "Đã hủy";
  if (race.Ngay < today) return "Đã diễn ra";
  if (race.registrationDeadline && race.registrationDeadline < today) return "Hết hạn đăng ký";
  return "Đang mở";
}
