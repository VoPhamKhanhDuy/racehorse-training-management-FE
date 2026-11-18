import { daysBetween, todayISO } from "./date";

// Số ngày đã khóa: từ NgayDat tới NgayGo (đã gỡ) hoặc tới hôm nay (đang khóa). Vd đặt 29/09, hôm nay 11/10 → 12.
export function getLockDays(lock) {
  return daysBetween(lock.NgayDat, lock.NgayGo ?? todayISO());
}

