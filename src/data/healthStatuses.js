import { daysFromToday } from "../utils/date";

// Mock data — khớp bảng HEALTHSTATUS trong ERD (1 ngựa ↔ 1 trạng thái hiện tại)
// TrangThai: "Tốt" | "Cần theo dõi" | "Đang điều trị" (giá trị khác: "Chấn thương" | "Cách ly")
// "Đang điều trị" chặn đăng ký thi đấu; "Cần theo dõi" chỉ cảnh báo
const healthStatuses = [
  { HorseID: 1, TrangThai: "Tốt", NgayCapNhat: daysFromToday(-1) },
  { HorseID: 2, TrangThai: "Tốt", NgayCapNhat: daysFromToday(-1) },
  { HorseID: 3, TrangThai: "Đang điều trị", NgayCapNhat: daysFromToday(-3) },
  { HorseID: 4, TrangThai: "Tốt", NgayCapNhat: daysFromToday(-2) },
  { HorseID: 5, TrangThai: "Tốt", NgayCapNhat: daysFromToday(-1) },
  { HorseID: 6, TrangThai: "Cần theo dõi", NgayCapNhat: daysFromToday(0) },
];

export default healthStatuses;
