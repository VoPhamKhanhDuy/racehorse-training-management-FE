import { daysFromToday } from "../utils/date";

// Mock data — bảng CARETASK (công việc chăm sóc hằng ngày) trong ERD: TaskID, HorseID, GroomID, LoaiViec, TrangThai, Ngay
// TrangThai: boolean — true = đã hoàn thành. GroomID: UserID nhân viên chăm sóc (3, 12, 13, 14 ↔ U003, U012, U013, U014).
// Ngay tương đối so với hôm nay. LoaiViec: 6 loại ở config/careTaskSchedule.js (giờ chuẩn theo loại việc, ERD chưa có trường giờ).
// Phân công ngựa: U003 (groom@equitrack.vn) → Thunder, Lightning, Blaze; U013 → Storm; U014 → Shadow, Spirit;
// U012 đang bị khóa nên chỉ còn việc cũ đã xong.
// Demo U003: 9 việc hôm nay đủ 6 loại (3 việc ăn sáng 06:00 đã xong, 6 chưa) + 1 việc tồn từ hôm qua (Thunder, ăn chiều).
const careTasks = [
  // U003 — Lê Văn Nam: Thunder (1), Lightning (2), Blaze (4)
  { TaskID: 1, HorseID: 1, GroomID: 3, LoaiViec: "Cho ăn buổi sáng", TrangThai: true, Ngay: daysFromToday(0) },
  { TaskID: 2, HorseID: 2, GroomID: 3, LoaiViec: "Cho ăn buổi sáng", TrangThai: true, Ngay: daysFromToday(0) },
  { TaskID: 3, HorseID: 4, GroomID: 3, LoaiViec: "Cho ăn buổi sáng", TrangThai: true, Ngay: daysFromToday(0) },
  { TaskID: 4, HorseID: 1, GroomID: 3, LoaiViec: "Dọn chuồng", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 5, HorseID: 2, GroomID: 3, LoaiViec: "Tắm và chải lông", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 6, HorseID: 4, GroomID: 3, LoaiViec: "Kiểm tra móng", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 7, HorseID: 1, GroomID: 3, LoaiViec: "Vệ sinh yên cương", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 8, HorseID: 2, GroomID: 3, LoaiViec: "Cho ăn buổi chiều", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 9, HorseID: 4, GroomID: 3, LoaiViec: "Cho ăn buổi chiều", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 10, HorseID: 1, GroomID: 3, LoaiViec: "Cho ăn buổi chiều", TrangThai: false, Ngay: daysFromToday(-1) },

  // U013 — Đỗ Văn Hải: Storm (3)
  { TaskID: 11, HorseID: 3, GroomID: 13, LoaiViec: "Cho ăn buổi sáng", TrangThai: true, Ngay: daysFromToday(0) },
  { TaskID: 12, HorseID: 3, GroomID: 13, LoaiViec: "Kiểm tra móng", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 13, HorseID: 3, GroomID: 13, LoaiViec: "Cho ăn buổi chiều", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 14, HorseID: 3, GroomID: 13, LoaiViec: "Dọn chuồng", TrangThai: true, Ngay: daysFromToday(-1) },

  // U014 — Trương Thị Mai: Shadow (5), Spirit (6)
  { TaskID: 15, HorseID: 5, GroomID: 14, LoaiViec: "Cho ăn buổi sáng", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 16, HorseID: 5, GroomID: 14, LoaiViec: "Vệ sinh yên cương", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 17, HorseID: 6, GroomID: 14, LoaiViec: "Cho ăn buổi sáng", TrangThai: true, Ngay: daysFromToday(0) },
  { TaskID: 18, HorseID: 6, GroomID: 14, LoaiViec: "Kiểm tra móng", TrangThai: false, Ngay: daysFromToday(0) },
  { TaskID: 19, HorseID: 6, GroomID: 14, LoaiViec: "Dọn chuồng", TrangThai: true, Ngay: daysFromToday(-1) },

  // U012 — Phan Văn Tài (tài khoản đã bị khóa): chỉ còn việc cũ đã xong
  { TaskID: 20, HorseID: 3, GroomID: 12, LoaiViec: "Tắm và chải lông", TrangThai: true, Ngay: daysFromToday(-1) },
  { TaskID: 21, HorseID: 5, GroomID: 12, LoaiViec: "Cho ăn buổi chiều", TrangThai: true, Ngay: daysFromToday(-1) },
];

export default careTasks;
