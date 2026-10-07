import { daysFromToday } from "../utils/date";

// Mock data — khớp bảng HEALTHSTATUS trong ERD (1 ngựa ↔ 1 trạng thái hiện tại)
// TrangThai: "Đủ điều kiện" | "Cần theo dõi" | "Chấn thương" | "Cách ly"
const healthStatuses = [
  { HorseID: 1, TrangThai: "Đủ điều kiện", NgayCapNhat: daysFromToday(-1) },
  { HorseID: 2, TrangThai: "Đủ điều kiện", NgayCapNhat: daysFromToday(-1) },
  { HorseID: 3, TrangThai: "Chấn thương", NgayCapNhat: daysFromToday(-3) },
  { HorseID: 4, TrangThai: "Đủ điều kiện", NgayCapNhat: daysFromToday(-2) },
  { HorseID: 5, TrangThai: "Cần theo dõi", NgayCapNhat: daysFromToday(-1) },
  { HorseID: 6, TrangThai: "Đủ điều kiện", NgayCapNhat: daysFromToday(0) },
];

export default healthStatuses;
