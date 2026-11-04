// Danh mục + giới hạn cho MEDICALRECORD — form Ghi lần khám, sổ khám bệnh và vetService dùng chung

// "Không có chấn thương" loại trừ mọi vị trí khác; lưu vào ViTriChanThuong đúng chuỗi này
export const NO_INJURY = "Không có chấn thương";
export const INJURY_LOCATIONS = [
  "Đầu/cổ",
  "Vai",
  "Lưng",
  "Hông",
  "Bụng",
  "Chân trước trái",
  "Chân trước phải",
  "Chân sau trái",
  "Chân sau phải",
  "Gân",
  "Khớp",
  "Móng",
];
export const INJURY_SEPARATOR = ", ";

// Tình trạng sức khỏe bác sĩ chọn sau khám → ghi vào HorseHealthStatus (đúng 4 giá trị của backend).
export const HEALTH_STATES = ["Đủ điều kiện", "Cần theo dõi", "Chấn thương", "Cách ly"];
// Có chấn thương và chọn trạng thái này thì tự đặt lệnh khóa huấn luyện.
export const TREATMENT_STATE = "Chấn thương";

export const MEDICAL_LIMITS = {
  ChanDoan: { min: 5, max: 200 }, // số ký tự
  PhacDo: { min: 5, max: 500 }, // số ký tự
};

// Sổ khám bệnh hiển thị các lần khám trong N ngày gần đây
export const EXAM_WINDOW_DAYS = 60;

// ---- Lệnh khóa huấn luyện (TRAININGLOCK) ----
export const LOCK_REASON_LIMITS = { min: 5, max: 200 }; // số ký tự LyDo
// Gỡ khóa: bác sĩ bắt buộc chọn tình trạng mới, ngựa được tập lại có giới hạn hoặc đủ điều kiện.
export const RELEASE_HEALTH_STATES = ["Cần theo dõi", "Đủ điều kiện"];
