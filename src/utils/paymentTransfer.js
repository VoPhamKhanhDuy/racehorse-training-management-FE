// Nội dung chuyển khoản của Chủ ngựa: EQT-{TÊN KHÔNG DẤU}-T{MM}-{YYYY}, viết hoa, không dấu, không khoảng trắng.
// Ưu tiên họ tên đăng nhập (vd "Phạm Duy" → PHAMDUY); không có thì dùng id. Lấy từ phiên đăng nhập, không gọi API.
const toCode = (text) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

// Mã chủ ngựa dùng trong nội dung chuyển khoản và số chứng từ (vd PHAMDUY)
export function getOwnerCode(user) {
  return toCode(user.fullName) || toCode(user.id);
}

// monthKey: "YYYY-MM"
export function getTransferContent(user, monthKey) {
  return `EQT-${getOwnerCode(user)}-T${monthKey.slice(5, 7)}-${monthKey.slice(0, 4)}`;
}
