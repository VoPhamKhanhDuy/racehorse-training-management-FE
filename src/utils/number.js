// Làm tròn 1 số lẻ theo kiểu Việt Nam: 12,34 → "12,3"; 12 → "12"
export const formatOneDecimal = (value) =>
  (Math.round(value * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });

// Phần trăm 2 số lẻ theo kiểu Việt Nam: 84.615 → "84,62%"
export const formatPercent = (value) =>
  `${value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

// Tổng giá trị pick(item) trên danh sách
export const sumOf = (items, pick) => items.reduce((sum, item) => sum + pick(item), 0);
