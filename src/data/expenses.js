import { daysFromToday } from "../utils/date";

// Mock data — bảng EXPENSE (chi phí câu lạc bộ ghi cho từng ngựa) trong ERD mới: ExpenseID, HorseID, LoaiChiPhi, SoTien, Ngay, GhiChu
// TRƯỜNG/BẢNG MỚI — cần BE xác nhận. LoaiChiPhi ∈ EXPENSE_TYPES (data/expenseOptions.js). SoTien: VNĐ (số nguyên).
// Ngay tương đối so với hôm nay (trong ~3 tháng gần nhất). Seed cho MỌI ngựa hiện có (6 ngựa của 3 chủ ngựa demo), mỗi ngựa
// 8 khoản; ngựa mới thêm sau này không có seed nên chi phí = 0.
// Chỉ để chủ ngựa XEM — việc thanh toán diễn ra ngoài hệ thống.
const expenses = [
  // Thunder (1)
  { ExpenseID: 1, HorseID: 1, LoaiChiPhi: "Thức ăn", SoTien: 4200000, Ngay: daysFromToday(-78), GhiChu: "Cám ngựa đua và cỏ khô tháng trước" },
  { ExpenseID: 2, HorseID: 1, LoaiChiPhi: "Huấn luyện", SoTien: 3500000, Ngay: daysFromToday(-74), GhiChu: "Phí huấn luyện viên tháng 8" },
  { ExpenseID: 3, HorseID: 1, LoaiChiPhi: "Thú y", SoTien: 650000, Ngay: daysFromToday(-60), GhiChu: "Tiêm phòng định kỳ" },
  { ExpenseID: 4, HorseID: 1, LoaiChiPhi: "Thức ăn", SoTien: 4400000, Ngay: daysFromToday(-47), GhiChu: "Cám ngựa đua và cỏ khô tháng 9" },
  { ExpenseID: 5, HorseID: 1, LoaiChiPhi: "Huấn luyện", SoTien: 3500000, Ngay: daysFromToday(-44), GhiChu: "Phí huấn luyện viên tháng 9" },
  { ExpenseID: 6, HorseID: 1, LoaiChiPhi: "Vật tư", SoTien: 480000, Ngay: daysFromToday(-30), GhiChu: "Thay móng sắt, băng chân" },
  { ExpenseID: 7, HorseID: 1, LoaiChiPhi: "Thức ăn", SoTien: 4300000, Ngay: daysFromToday(-16), GhiChu: "Cám ngựa đua, vitamin tổng hợp" },
  { ExpenseID: 8, HorseID: 1, LoaiChiPhi: "Thú y", SoTien: 1200000, Ngay: daysFromToday(-5), GhiChu: "Khám và điều trị" },

  // Shadow (5)
  { ExpenseID: 9, HorseID: 5, LoaiChiPhi: "Thức ăn", SoTien: 3600000, Ngay: daysFromToday(-80), GhiChu: "Cám và cỏ khô tháng trước" },
  { ExpenseID: 10, HorseID: 5, LoaiChiPhi: "Huấn luyện", SoTien: 3000000, Ngay: daysFromToday(-72), GhiChu: "Phí huấn luyện viên tháng 8" },
  { ExpenseID: 11, HorseID: 5, LoaiChiPhi: "Thú y", SoTien: 380000, Ngay: daysFromToday(-55), GhiChu: "Tẩy giun định kỳ" },
  { ExpenseID: 12, HorseID: 5, LoaiChiPhi: "Thức ăn", SoTien: 3700000, Ngay: daysFromToday(-49), GhiChu: "Cám và cỏ khô tháng 9" },
  { ExpenseID: 13, HorseID: 5, LoaiChiPhi: "Huấn luyện", SoTien: 3000000, Ngay: daysFromToday(-42), GhiChu: "Phí huấn luyện viên tháng 9" },
  { ExpenseID: 14, HorseID: 5, LoaiChiPhi: "Vật tư", SoTien: 320000, Ngay: daysFromToday(-26), GhiChu: "Dầu bóng móng, bàn chải lông" },
  { ExpenseID: 15, HorseID: 5, LoaiChiPhi: "Thú y", SoTien: 850000, Ngay: daysFromToday(-14), GhiChu: "Khám và điều trị" },
  { ExpenseID: 16, HorseID: 5, LoaiChiPhi: "Thức ăn", SoTien: 3650000, Ngay: daysFromToday(-9), GhiChu: "Cám và cỏ khô tháng 10" },

  // Storm (3) — đang điều trị, chi phí thú y nhiều hơn, huấn luyện giảm
  { ExpenseID: 17, HorseID: 3, LoaiChiPhi: "Thức ăn", SoTien: 3200000, Ngay: daysFromToday(-76), GhiChu: "Cám và cỏ khô tháng trước" },
  { ExpenseID: 18, HorseID: 3, LoaiChiPhi: "Huấn luyện", SoTien: 3200000, Ngay: daysFromToday(-70), GhiChu: "Phí huấn luyện viên tháng 8" },
  { ExpenseID: 19, HorseID: 3, LoaiChiPhi: "Thức ăn", SoTien: 3300000, Ngay: daysFromToday(-45), GhiChu: "Cám và cỏ khô tháng 9" },
  { ExpenseID: 20, HorseID: 3, LoaiChiPhi: "Huấn luyện", SoTien: 3200000, Ngay: daysFromToday(-40), GhiChu: "Phí huấn luyện viên tháng 9" },
  { ExpenseID: 21, HorseID: 3, LoaiChiPhi: "Thú y", SoTien: 2800000, Ngay: daysFromToday(-12), GhiChu: "Khám và điều trị" },
  { ExpenseID: 22, HorseID: 3, LoaiChiPhi: "Vật tư", SoTien: 560000, Ngay: daysFromToday(-11), GhiChu: "Vật tư chăm sóc, băng chân" },
  { ExpenseID: 23, HorseID: 3, LoaiChiPhi: "Thú y", SoTien: 900000, Ngay: daysFromToday(-4), GhiChu: "Điều trị thú y" },
  { ExpenseID: 24, HorseID: 3, LoaiChiPhi: "Thức ăn", SoTien: 2100000, Ngay: daysFromToday(-2), GhiChu: "Cỏ khô tháng 10" },

  // Lightning (2) — chủ owner2@equitrack.vn
  { ExpenseID: 25, HorseID: 2, LoaiChiPhi: "Thức ăn", SoTien: 4600000, Ngay: daysFromToday(-82), GhiChu: "Cám ngựa đua và cỏ khô tháng 7" },
  { ExpenseID: 26, HorseID: 2, LoaiChiPhi: "Huấn luyện", SoTien: 4000000, Ngay: daysFromToday(-75), GhiChu: "Phí HLV tháng 8" },
  { ExpenseID: 27, HorseID: 2, LoaiChiPhi: "Thú y", SoTien: 720000, Ngay: daysFromToday(-58), GhiChu: "Tiêm phòng định kỳ" },
  { ExpenseID: 28, HorseID: 2, LoaiChiPhi: "Thức ăn", SoTien: 4700000, Ngay: daysFromToday(-50), GhiChu: "Cỏ khô tháng 9" },
  { ExpenseID: 29, HorseID: 2, LoaiChiPhi: "Huấn luyện", SoTien: 4000000, Ngay: daysFromToday(-45), GhiChu: "Phí HLV tháng 9" },
  { ExpenseID: 30, HorseID: 2, LoaiChiPhi: "Vật tư", SoTien: 540000, Ngay: daysFromToday(-28), GhiChu: "Bàn chải lông, dầu bóng móng" },
  { ExpenseID: 31, HorseID: 2, LoaiChiPhi: "Thú y", SoTien: 1500000, Ngay: daysFromToday(-15), GhiChu: "Khám và điều trị" },
  { ExpenseID: 32, HorseID: 2, LoaiChiPhi: "Huấn luyện", SoTien: 4000000, Ngay: daysFromToday(-8), GhiChu: "Phí HLV tháng 10" },

  // Blaze (4) — chủ owner3@equitrack.vn
  { ExpenseID: 33, HorseID: 4, LoaiChiPhi: "Thức ăn", SoTien: 4800000, Ngay: daysFromToday(-84), GhiChu: "Cám và cỏ linh lăng tháng 7" },
  { ExpenseID: 34, HorseID: 4, LoaiChiPhi: "Thú y", SoTien: 2400000, Ngay: daysFromToday(-71), GhiChu: "Điều trị thú y" },
  { ExpenseID: 35, HorseID: 4, LoaiChiPhi: "Huấn luyện", SoTien: 2500000, Ngay: daysFromToday(-65), GhiChu: "Phí HLV tháng 8" },
  { ExpenseID: 36, HorseID: 4, LoaiChiPhi: "Thức ăn", SoTien: 4900000, Ngay: daysFromToday(-48), GhiChu: "Cỏ khô tháng 9" },
  { ExpenseID: 37, HorseID: 4, LoaiChiPhi: "Huấn luyện", SoTien: 3800000, Ngay: daysFromToday(-40), GhiChu: "Phí HLV tháng 9" },
  { ExpenseID: 38, HorseID: 4, LoaiChiPhi: "Thú y", SoTien: 700000, Ngay: daysFromToday(-22), GhiChu: "Tiêm phòng định kỳ" },
  { ExpenseID: 39, HorseID: 4, LoaiChiPhi: "Vật tư", SoTien: 610000, Ngay: daysFromToday(-13), GhiChu: "Móng sắt mới" },
  { ExpenseID: 40, HorseID: 4, LoaiChiPhi: "Thức ăn", SoTien: 4800000, Ngay: daysFromToday(-6), GhiChu: "Cám và cỏ khô tháng 10" },

  // Spirit (6) — chủ owner3@equitrack.vn, có tiền thưởng hạng nhất
  { ExpenseID: 41, HorseID: 6, LoaiChiPhi: "Thức ăn", SoTien: 3300000, Ngay: daysFromToday(-79), GhiChu: "Cám và cỏ khô tháng 7" },
  { ExpenseID: 42, HorseID: 6, LoaiChiPhi: "Huấn luyện", SoTien: 3200000, Ngay: daysFromToday(-73), GhiChu: "Phí HLV tháng 8" },
  { ExpenseID: 43, HorseID: 6, LoaiChiPhi: "Thú y", SoTien: 450000, Ngay: daysFromToday(-57), GhiChu: "Tẩy giun định kỳ" },
  { ExpenseID: 44, HorseID: 6, LoaiChiPhi: "Thức ăn", SoTien: 3400000, Ngay: daysFromToday(-46), GhiChu: "Cỏ khô tháng 9" },
  { ExpenseID: 45, HorseID: 6, LoaiChiPhi: "Huấn luyện", SoTien: 3200000, Ngay: daysFromToday(-41), GhiChu: "Phí HLV tháng 9" },
  { ExpenseID: 46, HorseID: 6, LoaiChiPhi: "Vật tư", SoTien: 390000, Ngay: daysFromToday(-24), GhiChu: "Yên cương bảo dưỡng, băng chân" },
  { ExpenseID: 47, HorseID: 6, LoaiChiPhi: "Thú y", SoTien: 600000, Ngay: daysFromToday(-10), GhiChu: "Khám và điều trị" },
  { ExpenseID: 48, HorseID: 6, LoaiChiPhi: "Huấn luyện", SoTien: 3200000, Ngay: daysFromToday(-7), GhiChu: "Phí HLV tháng 10" },
];

export default expenses;
