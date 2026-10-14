import { daysFromToday } from "../utils/date";

// Mock data — bảng RACEREGISTRATION (đăng ký thi đấu) trong ERD: HorseID, RaceID, NgayDangKy, ThuHang, TienThuong
// Khóa chính ghép HorseID + RaceID (1 ngựa không đăng ký trùng 1 giải).
// ThuHang (số nguyên) — TRƯỜNG MỚI, cần BE xác nhận: null = chưa có kết quả; 0 = không xếp hạng; 1, 2, 3… = thứ hạng.
// Chỉ HLV nhập/sửa, chỉ với giải đã diễn ra; không trùng hạng (≥ 1) giữa các ngựa trong cùng giải.
// TienThuong (VNĐ, số nguyên hoặc null) — TRƯỜNG MỚI, cần BE xác nhận: tiền thưởng của ngựa ở giải đó; chỉ có khi ThuHang 1–3,
// null nếu chưa có kết quả / không xếp hạng. Chủ ngựa xem ở trang "Chi phí & tiền thưởng".
// Demo: giải 1 (đã qua 9 ngày) đã nhập đủ hạng; giải 6 (đã qua 24 ngày) mới nhập hạng 3 của Thunder, 2 ngựa còn lại chưa nhập; giải +6 có Blaze + Lightning;
// giải +15 có Storm (đăng ký trước khi bị khóa tập); giải +27 có Thunder (chủ ngựa demo thấy ở trang Lịch trình); giải còn lại để trống.
const raceRegistrations = [
  { HorseID: 1, RaceID: 1, NgayDangKy: daysFromToday(-30), ThuHang: 2, TienThuong: 20000000 },
  { HorseID: 6, RaceID: 1, NgayDangKy: daysFromToday(-28), ThuHang: 1, TienThuong: 50000000 },
  { HorseID: 5, RaceID: 1, NgayDangKy: daysFromToday(-27), ThuHang: 0, TienThuong: null },
  { HorseID: 2, RaceID: 6, NgayDangKy: daysFromToday(-40), ThuHang: null, TienThuong: null },
  { HorseID: 4, RaceID: 6, NgayDangKy: daysFromToday(-38), ThuHang: null, TienThuong: null },
  { HorseID: 1, RaceID: 6, NgayDangKy: daysFromToday(-36), ThuHang: 3, TienThuong: null }, // hạng Ba, Quản lý chưa nhập tiền thưởng
  { HorseID: 4, RaceID: 2, NgayDangKy: daysFromToday(-12), ThuHang: null, TienThuong: null },
  { HorseID: 2, RaceID: 2, NgayDangKy: daysFromToday(-8), ThuHang: null, TienThuong: null },
  { HorseID: 3, RaceID: 3, NgayDangKy: daysFromToday(-14), ThuHang: null, TienThuong: null },
  { HorseID: 1, RaceID: 4, NgayDangKy: daysFromToday(-3), ThuHang: null, TienThuong: null },
];

export default raceRegistrations;
