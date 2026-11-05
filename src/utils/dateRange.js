import { addDays } from "./date";

// Bộ lọc "Thời gian" dùng chung cho các bảng có cột ngày
export const PERIODS = [
  { value: "all", label: "Tất cả" },
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "month", label: "Tháng này" },
  { value: "custom", label: "Tùy chọn" },
];

// Khoảng ngày [from, to] (yyyy-MM-dd, gồm cả hai đầu) của 1 lựa chọn; null = không lọc. custom: from / to có thể rỗng (mở một đầu).
export function periodRange(period, today, customFrom = "", customTo = "") {
  switch (period) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month": {
      const [year, month] = today.split("-").map(Number);
      const last = new Date(year, month, 0).getDate();
      return { from: `${year}-${String(month).padStart(2, "0")}-01`, to: `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}` };
    }
    case "custom":
      return customFrom || customTo ? { from: customFrom || "0000-01-01", to: customTo || "9999-12-31" } : null;
    default:
      return null;
  }
}

// Ngày có nằm trong khoảng không (không có khoảng → luôn đúng; thiếu ngày → loại khi đang lọc)
export function inRange(date, range) {
  if (!range) return true;
  if (!date) return false;
  return date >= range.from && date <= range.to;
}
