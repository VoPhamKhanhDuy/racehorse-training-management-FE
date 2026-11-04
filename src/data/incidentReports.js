import { daysFromToday } from "../utils/date";

// Mock data — bảng INCIDENTREPORT (báo cáo sự cố) trong ERD: ReportID, HorseID, GroomID, LoaiSuCo, MoTa, HinhAnh, Ngay
// GroomID: UserID nhân viên gửi (3 = groom@equitrack.vn; 13, 14 = nhân viên khác). LoaiSuCo: 1 trong INCIDENT_TYPES
// (data/incidentOptions.js). MoTa: không bắt buộc, tối đa 300 ký tự ("" = không có). HinhAnh: URL ảnh — để trống,
// sẽ thêm ảnh thật sau. Ngay tương đối so với hôm nay.
const incidentReports = [
  // U003 — Lê Văn Nam (Thunder, Lightning, Blaze)
  {
    ReportID: 1,
    HorseID: 1,
    GroomID: 3,
    LoaiSuCo: "Vết thương",
    MoTa: "Xây xát nhẹ ở cẳng chân trước phải sau khi dắt đi bộ, không chảy máu.",
    HinhAnh: "",
    Ngay: daysFromToday(-2),
  },
  { ReportID: 2, HorseID: 4, GroomID: 3, LoaiSuCo: "Chuồng/thiết bị hỏng", MoTa: "Chốt cửa chuồng B1 bị lỏng, cần sửa.", HinhAnh: "", Ngay: daysFromToday(-9) },
  { ReportID: 3, HorseID: 2, GroomID: 3, LoaiSuCo: "Bỏ ăn", MoTa: "Chỉ ăn một nửa khẩu phần buổi sáng.", HinhAnh: "", Ngay: daysFromToday(-24) },
  { ReportID: 4, HorseID: 1, GroomID: 3, LoaiSuCo: "Khập khiễng", MoTa: "Đi hơi nặng chân sau trái lúc dắt ra bãi.", HinhAnh: "", Ngay: daysFromToday(-41) },
  // Nhân viên khác — không hiện trong danh sách của U003
  { ReportID: 5, HorseID: 3, GroomID: 13, LoaiSuCo: "Bỏ ăn", MoTa: "Bỏ dở bữa chiều, uống nước bình thường.", HinhAnh: "", Ngay: daysFromToday(-4) },
  { ReportID: 6, HorseID: 5, GroomID: 14, LoaiSuCo: "Vết thương", MoTa: "Trầy da ở vai trái, nghi do cọ vào vách chuồng.", HinhAnh: "", Ngay: daysFromToday(-12) },
  { ReportID: 7, HorseID: 6, GroomID: 14, LoaiSuCo: "Khác", MoTa: "", HinhAnh: "", Ngay: daysFromToday(-30) },
];

export default incidentReports;
