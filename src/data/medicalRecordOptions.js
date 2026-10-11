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

// Tình trạng sức khỏe bác sĩ chọn sau khám → ghi vào HEALTHSTATUS.TrangThai
export const HEALTH_STATES = ["Tốt", "Cần theo dõi", "Đang điều trị"];
// Tình trạng gợi ý đặt lệnh khóa huấn luyện sau khi lưu
export const TREATMENT_STATE = "Đang điều trị";

export const MEDICAL_LIMITS = {
  ChanDoan: { min: 5, max: 200 }, // số ký tự
  PhacDo: { min: 5, max: 500 }, // số ký tự
};

// Sổ khám bệnh hiển thị các lần khám trong N ngày gần đây
export const EXAM_WINDOW_DAYS = 60;

// ---- Lệnh khóa huấn luyện (TRAININGLOCK) ----
export const LOCK_REASON_LIMITS = { min: 5, max: 200 }; // số ký tự LyDo
// Gỡ khóa: bác sĩ bắt buộc chọn tình trạng mới (không có "Đang điều trị")
export const RELEASE_HEALTH_STATES = ["Cần theo dõi", "Tốt"];
