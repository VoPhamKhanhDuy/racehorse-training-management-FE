import { daysBetween, todayISO } from "./date";

// Số ngày đã khóa: từ NgayDat tới NgayGo (đã gỡ) hoặc tới hôm nay (đang khóa). Vd đặt 29/09, hôm nay 11/10 → 12.
export function getLockDays(lock) {
  return daysBetween(lock.NgayDat, lock.NgayGo ?? todayISO());
}

// Nhãn cột "Thời gian" ở danh sách lệnh khóa: đang khóa → "Ngày thứ N" (tính cả ngày đặt); đã gỡ → "N ngày"
export function lockDuration(lock) {
  return lock.NgayGo ? `${getLockDays(lock)} ngày` : `Ngày thứ ${getLockDays(lock) + 1}`;
}

// Nhãn nhắc HLV khi ngựa bị khóa mà vẫn còn lịch tập / đăng ký giải sắp tới (hệ thống không tự xóa, HLV tự xử lý)
export const LOCK_CONFLICT_SCHEDULE = "Ngựa đang bị khóa huấn luyện — cần đổi lịch";
export const LOCK_CONFLICT_RACE = "Ngựa đang bị khóa huấn luyện — cần rút đăng ký";
