// Đổi Date → "YYYY-MM-DD" theo giờ địa phương (giá trị của <input type="date">)
export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

// Ngày cách hôm nay n ngày (n âm = quá khứ), dạng "YYYY-MM-DD"
export function daysFromToday(n) {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return toISODate(date);
}

// "2026-10-07" → "07/10/2026"
export function formatDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

// Số ngày từ ngày "YYYY-MM-DD" tới hôm nay (theo lịch, không tính giờ)
export function daysSince(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const then = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / 86400000);
}

// "2026-10-04" → "5 ngày trước" / "hôm nay"
export function formatDaysAgo(isoDate) {
  const days = daysSince(isoDate);
  return days <= 0 ? "hôm nay" : `${days} ngày trước`;
}

// Đổi Date → "YYYY-MM-DDTHH:mm" theo giờ địa phương (dạng thời điểm trong nhật ký thao tác)
export function toISODateTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${toISODate(date)}T${hours}:${minutes}`;
}

// Thời điểm cách hiện tại n giờ (n âm = quá khứ), dạng "YYYY-MM-DDTHH:mm"
export function hoursFromNow(n) {
  return toISODateTime(new Date(Date.now() + n * 3600000));
}

// Thời điểm lúc "HH:mm" của ngày cách hôm nay n ngày, dạng "YYYY-MM-DDTHH:mm"
export function dateTimeFromToday(n, time) {
  return `${daysFromToday(n)}T${time}`;
}

// "YYYY-MM-DDTHH:mm" → Date theo giờ địa phương
export function parseISODateTime(isoDateTime) {
  const [datePart, timePart = "00:00"] = isoDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

// Trong vòng 1 ngày: "vừa xong" / "15 phút trước" / "2 giờ trước"; cũ hơn: "09/10/2026 18:30"
export function formatRelativeTime(isoDateTime) {
  const minutes = Math.floor((Date.now() - parseISODateTime(isoDateTime).getTime()) / 60000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} giờ trước`;
  const [datePart, timePart] = isoDateTime.split("T");
  return `${formatDate(datePart)} ${timePart}`;
}

// Cộng n ngày vào "YYYY-MM-DD"
export function addDays(isoDate, n) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return toISODate(new Date(year, month - 1, day + n));
}

// Thứ Hai của tuần chứa ngày "YYYY-MM-DD" (tuần tính Thứ Hai → Chủ nhật)
export function startOfWeek(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay(); // 0 = Chủ nhật
  return addDays(isoDate, weekday === 0 ? -6 : 1 - weekday);
}

const WEEKDAY_NAMES = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

// "2026-10-10" → "Thứ Bảy"
export function weekdayName(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
}

// "2026-10-10" → "10/10"
export function formatDayMonth(isoDate) {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

const SHORT_WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// "2026-10-10" → "T7"
export function shortWeekdayName(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return SHORT_WEEKDAYS[new Date(year, month - 1, day).getDay()];
}
