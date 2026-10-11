import { daysFromToday } from "../utils/date";

// Mock data — bảng RACEREGISTRATION (đăng ký thi đấu) trong ERD: HorseID, RaceID, NgayDangKy, ThuHang
// Khóa chính ghép HorseID + RaceID (1 ngựa không đăng ký trùng 1 giải).
// ThuHang (số nguyên) — TRƯỜNG MỚI, cần BE xác nhận: null = chưa có kết quả; 0 = không xếp hạng; 1, 2, 3… = thứ hạng.
// Chỉ HLV nhập/sửa, chỉ với giải đã diễn ra; không trùng hạng (≥ 1) giữa các ngựa trong cùng giải.
// Demo: giải 1 (đã qua 9 ngày) đã nhập đủ hạng; giải 6 (đã qua 24 ngày) chưa nhập; giải +6 có Blaze + Lightning;
// giải +15 có Storm (đăng ký trước khi bị khóa tập); giải +27 có Thunder (chủ ngựa demo thấy ở trang Lịch trình); giải còn lại để trống.
const raceRegistrations = [
  { HorseID: 1, RaceID: 1, NgayDangKy: daysFromToday(-30), ThuHang: 2 },
  { HorseID: 6, RaceID: 1, NgayDangKy: daysFromToday(-28), ThuHang: 1 },
  { HorseID: 5, RaceID: 1, NgayDangKy: daysFromToday(-27), ThuHang: 0 },
  { HorseID: 2, RaceID: 6, NgayDangKy: daysFromToday(-40), ThuHang: null },
  { HorseID: 4, RaceID: 6, NgayDangKy: daysFromToday(-38), ThuHang: null },
  { HorseID: 1, RaceID: 6, NgayDangKy: daysFromToday(-36), ThuHang: null },
  { HorseID: 4, RaceID: 2, NgayDangKy: daysFromToday(-12), ThuHang: null },
  { HorseID: 2, RaceID: 2, NgayDangKy: daysFromToday(-8), ThuHang: null },
  { HorseID: 3, RaceID: 3, NgayDangKy: daysFromToday(-14), ThuHang: null },
  { HorseID: 1, RaceID: 4, NgayDangKy: daysFromToday(-3), ThuHang: null },
];

export default raceRegistrations;
