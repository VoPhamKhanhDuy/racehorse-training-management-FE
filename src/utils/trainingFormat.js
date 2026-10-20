// Hàm tiện ích cho các màn giáo án / buổi tập nối API thật
import { INTENSITY_ORDER } from "../data/trainingCodes";
import { addDays, formatDate, startOfWeek, todayISO, toISODate } from "./date";

const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

const isBlank = (value) => value === null || value === undefined || value === "";

// 3.5 → "3,5"; trống → "—"
export function formatNumber(value) {
  return isBlank(value) ? "—" : numberFormat.format(Number(value));
}

export function formatKm(value) {
  return isBlank(value) ? "—" : `${formatNumber(value)} km`;
}

export function formatMinutes(value) {
  return isBlank(value) ? "—" : `${formatNumber(value)} phút`;
}

// "06:00" + "06:40" → "06:00–06:40"
export function formatTimeRange(startTime, endTime) {
  if (!startTime) return "";
  return endTime ? `${startTime}–${endTime}` : startTime;
}

// Mốc thời gian UTC của BE ("2026-10-12T08:00:00Z") → "12/10/2026 15:00" theo giờ máy
export function formatDateTime(isoUtc) {
  if (!isoUtc) return "";
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) return "";
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${formatDate(toISODate(date))} ${time}`;
}

// Thứ tự cường độ (Recovery = 0 … High = 3); mã lạ → -1
export function intensityRank(code) {
  return INTENSITY_ORDER.indexOf(code);
}

// Cường độ code có nằm trong mức trần max không (max = null → không được tập)
export function isIntensityAllowed(code, max) {
  if (!max) return false;
  return intensityRank(code) <= intensityRank(max);
}

// Mức thấp hơn trong 2 mức (bỏ qua giá trị trống)
export function lowerIntensity(a, b) {
  if (!a) return b;
  if (!b) return a;
  return intensityRank(a) <= intensityRank(b) ? a : b;
}

// Thứ Hai tới, hoặc hôm nay nếu hôm nay là Thứ Hai — giống mặc định startDate của API gợi ý giáo án
export function nextMondayISO() {
  const today = todayISO();
  const monday = startOfWeek(today);
  return monday === today ? today : addDays(monday, 7);
}

// Thứ Hai → Chủ Nhật của tuần chứa ngày isoDate
export function weekBounds(isoDate) {
  const start = startOfWeek(isoDate);
  return { start, end: addDays(start, 6) };
}
