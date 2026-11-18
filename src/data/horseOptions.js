import { HORSE_MAX_AGE, HORSE_MIN_AGE } from "../config/horseAge";

// Giới hạn hợp lệ cho HORSE — form Thêm/Sửa ngựa và horseService dùng chung
export const HORSE_LIMITS = {
  Ten: { min: 2, max: 30 }, // số ký tự
  Age: { min: HORSE_MIN_AGE, max: HORSE_MAX_AGE }, // tuổi tính từ NgaySinh (số năm tròn)
  CanNang: { min: 200, max: 700 }, // kg, tối đa 1 chữ số thập phân
  DongDoi: { min: 2, max: 60 }, // số ký tự
};

// GioiTinh chỉ nhận đúng 3 giá trị này
export const HORSE_GENDERS = ["Ngựa đực", "Ngựa cái", "Ngựa thiến"];
// Nhãn tiếng Anh hiển thị trên chip chọn giới tính ở form hồ sơ ngựa — chỉ là nhãn, giá trị lưu / gửi API vẫn là tiếng Việt ở trên
export const HORSE_GENDER_LABELS = { "Ngựa đực": "Male", "Ngựa cái": "Female", "Ngựa thiến": "Gelding" };

// Gợi ý cho ô Màu lông (MauLong) — vẫn cho nhập màu khác
export const COAT_COLORS = ["Nâu", "Nâu sẫm", "Hạt dẻ", "Xám", "Đen", "Trắng", "Vàng nhạt"];

// Ảnh ngựa: định dạng + dung lượng tối đa
export const HORSE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const HORSE_PHOTO_MAX_MB = 5;

export const DUPLICATE_HORSE_NAME = "Đã có ngựa trùng tên này.";
export const INVALID_BIRTH_DATE = `Ngày sinh không hợp lệ (ngựa phải từ ${HORSE_MIN_AGE} đến ${HORSE_MAX_AGE} tuổi).`;
