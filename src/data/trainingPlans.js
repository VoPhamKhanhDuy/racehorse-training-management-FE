// Mock data — khớp bảng TRAININGPLAN trong ERD
// CuLy: mét, KhoiLuong: khối lượng tập, CreatedBy: UserID của HLV tạo giáo án (1 = HLV trưởng)
const trainingPlans = [
  { PlanID: 1, HorseID: 1, CuLy: 1200, KhoiLuong: 80, MatSan: "Đường đất", GiaiDoan: "Nền tảng", CreatedBy: 1 },
  { PlanID: 2, HorseID: 2, CuLy: 1600, KhoiLuong: 90, MatSan: "Đường cỏ", GiaiDoan: "Tăng tốc", CreatedBy: 1 },
  { PlanID: 3, HorseID: 4, CuLy: 1000, KhoiLuong: 60, MatSan: "Đường đất", GiaiDoan: "Phục hồi", CreatedBy: 1 },
  { PlanID: 4, HorseID: 6, CuLy: 2000, KhoiLuong: 100, MatSan: "Đường cỏ", GiaiDoan: "Tiền thi đấu", CreatedBy: 1 },
  { PlanID: 5, HorseID: 5, CuLy: 800, KhoiLuong: 50, MatSan: "Đường cát", GiaiDoan: "Nền tảng", CreatedBy: 1 },
  { PlanID: 6, HorseID: 1, CuLy: 1400, KhoiLuong: 85, MatSan: "Đường cỏ", GiaiDoan: "Tăng tốc", CreatedBy: 1 },
];

export default trainingPlans;
