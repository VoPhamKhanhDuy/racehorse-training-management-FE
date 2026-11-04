// Nhóm trạng thái sức khỏe dùng chung. Backend lưu Đủ điều kiện / Cần theo dõi / Chấn thương / Cách ly.
// "Tốt" và "Đang điều trị" còn được nhận để dữ liệu cũ trên giao diện vẫn đúng nhóm.
const READY = new Set(["Tốt", "Đủ điều kiện"]);
const BLOCKING = new Set(["Đang điều trị", "Chấn thương", "Cách ly"]);
const INJURY = new Set(["Đang điều trị", "Chấn thương"]);

export function isReadyHealth(status) {
  return READY.has(status);
}

export function isBlockingHealth(status) {
  return BLOCKING.has(status);
}

export function isInjuryHealth(status) {
  return INJURY.has(status);
}
