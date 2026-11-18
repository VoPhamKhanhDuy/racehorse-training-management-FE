// Làm tròn 1 số lẻ theo kiểu Việt Nam: 12,34 → "12,3"; 12 → "12"
export const formatOneDecimal = (value) =>
  (Math.round(value * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });

// Tổng giá trị pick(item) trên danh sách
export const sumOf = (items, pick) => items.reduce((sum, item) => sum + pick(item), 0);
