// Hạn thanh toán chi phí của Chủ ngựa. BE chưa có DueDate → tạm tính ở FE: ngày PAYMENT_DUE_DAY của tháng kế tiếp.
// TODO: thay bằng DueDate từ BE khi có (chỉ cần đổi getDueDate, nơi gọi giữ nguyên).
export const PAYMENT_DUE_DAY = 10;

// month: "YYYY-MM" (tháng chi phí) → "YYYY-MM-DD" hạn thanh toán
export function getDueDate(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(PAYMENT_DUE_DAY).padStart(2, "0")}`;
}
