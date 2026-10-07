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
