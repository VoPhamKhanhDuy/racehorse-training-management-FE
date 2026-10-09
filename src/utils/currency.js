// Định dạng tiền VNĐ
// 232220000 → "232.220.000 ₫"
export function formatCurrency(amount) {
  return `${Math.round(amount).toLocaleString("vi-VN")} ₫`;
}

// Rút gọn cho số liệu lớn: 232220000 → "232,2 triệu", 1500000000 → "1,5 tỷ"
export function formatCompactCurrency(amount) {
  const format = (value) => value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  if (amount >= 1e9) return `${format(amount / 1e9)} tỷ`;
  if (amount >= 1e6) return `${format(amount / 1e6)} triệu`;
  return formatCurrency(amount);
}
