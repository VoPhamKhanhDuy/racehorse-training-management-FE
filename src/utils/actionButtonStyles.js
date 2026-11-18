// Màu nút hành động dạng outline trên dòng bảng (/manager/staff, /manager/supplies).
// Cả bộ cùng độ sáng + độ bão hòa trong OKLCH (L 0.54, C 0.092 — lấy theo xanh rêu "Đang hoạt động"),
// chỉ khác sắc độ, nên không nút nào rực hơn nút nào. Tương phản trên nền trắng đều ~5:1.
const actionButtonColors = {
  // Xanh dương trầm (hue 250): Sửa
  blue: "border-[#4373a3]/40 text-[#4373a3] hover:border-[#4373a3] hover:bg-[#4373a3]/10",
  // Hổ phách trầm (hue 65): Khóa, Xuất kho — khác hẳn cam sáng brass của nút tạo mới
  amber: "border-[#946330]/40 text-[#946330] hover:border-[#946330] hover:bg-[#946330]/10",
  // Xanh rêu (hue 131): Mở khóa, Nhập kho — cùng tông chữ "Đang hoạt động"
  moss: "border-[#5c7a3f]/40 text-[#5c7a3f] hover:border-[#5c7a3f] hover:bg-[#5c7a3f]/10",
  // Đỏ trầm (hue 25): Xóa — trầm hơn đỏ cảnh báo --color-alert để hợp bộ
  red: "border-[#9e5954]/40 text-[#9e5954] hover:border-[#9e5954] hover:bg-[#9e5954]/10",
};

export default actionButtonColors;
