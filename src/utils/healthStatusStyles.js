// Màu pastel theo HEALTHSTATUS.TrangThai — dùng chung cho badge trạng thái (thẻ ngựa, modal, trang HLV)
// và nền ảnh placeholder. Không dùng đỏ gắt --color-alert (dành cho nút Xóa/cảnh báo).
// text: chỉ đổi màu chữ, không nền/không chấm — dùng ở Hồ sơ ngựa của HLV (trạng thái là chữ thường)
const healthStatusStyles = {
  "Tốt": { badge: "bg-green-100 text-green-700", tint: "bg-green-50 text-green-700/35", text: "text-bark" },
  "Đủ điều kiện": { badge: "bg-green-100 text-green-700", tint: "bg-green-50 text-green-700/35", text: "text-bark" },
  "Cần theo dõi": { badge: "bg-yellow-100 text-yellow-800", tint: "bg-yellow-50 text-yellow-700/35", text: "text-brass-deep" },
  "Chấn thương": { badge: "bg-red-100 text-rose-700", tint: "bg-red-50 text-rose-700/35", text: "text-taupe" },
  "Đang điều trị": { badge: "bg-red-100 text-rose-700", tint: "bg-red-50 text-rose-700/35", text: "text-taupe" },
  "Cách ly": { badge: "bg-red-100 text-rose-700", tint: "bg-red-50 text-rose-700/35", text: "text-taupe" },
};

// Ngựa chưa có bản ghi sức khỏe
const unknownStyle = { badge: "bg-gray-100 text-stone", tint: "bg-gray-100 text-stone/35", text: "text-stone" };

export function isHealthStatus(status) {
  return status in healthStatusStyles;
}

export function getHealthStyle(status) {
  return healthStatusStyles[status] ?? unknownStyle;
}

export function getHealthLabel(status) {
  return status || "Chưa cập nhật";
}
