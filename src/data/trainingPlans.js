// Mock data — khớp bảng TRAININGPLAN trong ERD
// CuLy: cự ly bài tập, KhoiLuong: khối lượng tập — đơn vị khai báo ở data/trainingPlanOptions.js (PLAN_UNITS)
// GiaiDoan / MatSan: lấy từ TRAINING_PHASES / TRACK_SURFACES
// CreatedBy: UserID của HLV tạo giáo án (1 = HLV trưởng trainer@equitrack.vn).
// Ràng buộc: mỗi ngựa tối đa 1 giáo án cho mỗi giai đoạn (HorseID + GiaiDoan là duy nhất).
// Thunder đủ 4 giai đoạn; Storm (ngựa 3) chưa có giáo án nào.
const trainingPlans = [
  { PlanID: 1, HorseID: 1, CuLy: 1200, KhoiLuong: 18, MatSan: "Cát", GiaiDoan: "Nền tảng", CreatedBy: 1 },
  { PlanID: 2, HorseID: 1, CuLy: 1400, KhoiLuong: 22, MatSan: "Cỏ", GiaiDoan: "Tăng tốc", CreatedBy: 1 },
  { PlanID: 3, HorseID: 2, CuLy: 1600, KhoiLuong: 24, MatSan: "Cỏ", GiaiDoan: "Tăng tốc", CreatedBy: 1 },
  { PlanID: 4, HorseID: 2, CuLy: 1800, KhoiLuong: 20, MatSan: "Cỏ", GiaiDoan: "Tiền giải", CreatedBy: 1 },
  { PlanID: 5, HorseID: 4, CuLy: 1000, KhoiLuong: 10, MatSan: "Cát", GiaiDoan: "Phục hồi", CreatedBy: 1 },
  { PlanID: 6, HorseID: 6, CuLy: 2000, KhoiLuong: 26, MatSan: "Cỏ", GiaiDoan: "Tiền giải", CreatedBy: 1 },
  { PlanID: 7, HorseID: 5, CuLy: 800, KhoiLuong: 12, MatSan: "Sỏi", GiaiDoan: "Nền tảng", CreatedBy: 1 },
  { PlanID: 8, HorseID: 5, CuLy: 800, KhoiLuong: 8, MatSan: "Cát", GiaiDoan: "Phục hồi", CreatedBy: 1 },
  { PlanID: 9, HorseID: 6, CuLy: 1600, KhoiLuong: 22, MatSan: "Sỏi", GiaiDoan: "Tăng tốc", CreatedBy: 1 },
  { PlanID: 10, HorseID: 1, CuLy: 1600, KhoiLuong: 20, MatSan: "Cỏ", GiaiDoan: "Tiền giải", CreatedBy: 1 },
  { PlanID: 11, HorseID: 1, CuLy: 1000, KhoiLuong: 9, MatSan: "Cát", GiaiDoan: "Phục hồi", CreatedBy: 1 },
];

export default trainingPlans;
