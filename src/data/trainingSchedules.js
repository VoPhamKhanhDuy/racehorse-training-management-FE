import { daysFromToday } from "../utils/date";

// Mock data — khớp bảng TRAININGSCHEDULE trong ERD
// GroomID: nhân viên chăm sóc thực hiện lịch (3 = Lê Văn Nam, 13 = Đỗ Văn Hải, 14 = Trương Thị Mai), không phải HLV
// Ngay tính theo hôm nay (hôm nay + n ngày, n từ -3 đến +10): có cả buổi đã qua lẫn sắp tới.
// Mỗi ngựa tập cách ngày (~3–4 buổi/tuần, xen ngày nghỉ) ở 1 giờ cố định; nhân viên chia lần lượt cho 3 người
// nên không trùng giờ cùng ngựa / cùng nhân viên. Storm (ngựa 3) chỉ có 1 buổi xếp từ trước khi bị khóa tập.
// Buổi đã qua phần lớn khớp với trainingSessions.js — dùng tính tỷ lệ hoàn thành lịch ở trang Báo cáo.
const trainingSchedules = [
  { ScheduleID: 1, HorseID: 1, GroomID: 3, Ngay: daysFromToday(-3), Gio: "06:30" },
  { ScheduleID: 2, HorseID: 5, GroomID: 13, Ngay: daysFromToday(-3), Gio: "09:30" },
  { ScheduleID: 3, HorseID: 2, GroomID: 14, Ngay: daysFromToday(-2), Gio: "07:30" },
  { ScheduleID: 4, HorseID: 6, GroomID: 3, Ngay: daysFromToday(-2), Gio: "09:00" },
  { ScheduleID: 5, HorseID: 1, GroomID: 13, Ngay: daysFromToday(-1), Gio: "06:30" },
  { ScheduleID: 6, HorseID: 4, GroomID: 14, Ngay: daysFromToday(-1), Gio: "08:00" },
  { ScheduleID: 7, HorseID: 5, GroomID: 3, Ngay: daysFromToday(-1), Gio: "09:30" },
  { ScheduleID: 8, HorseID: 2, GroomID: 13, Ngay: daysFromToday(0), Gio: "07:30" },
  { ScheduleID: 9, HorseID: 6, GroomID: 14, Ngay: daysFromToday(0), Gio: "09:00" },
  { ScheduleID: 10, HorseID: 1, GroomID: 3, Ngay: daysFromToday(1), Gio: "06:30" },
  { ScheduleID: 11, HorseID: 4, GroomID: 13, Ngay: daysFromToday(1), Gio: "08:00" },
  { ScheduleID: 12, HorseID: 2, GroomID: 14, Ngay: daysFromToday(2), Gio: "07:30" },
  { ScheduleID: 13, HorseID: 3, GroomID: 3, Ngay: daysFromToday(2), Gio: "08:30" },
  { ScheduleID: 14, HorseID: 5, GroomID: 13, Ngay: daysFromToday(2), Gio: "09:30" },
  { ScheduleID: 15, HorseID: 1, GroomID: 14, Ngay: daysFromToday(3), Gio: "06:30" },
  { ScheduleID: 16, HorseID: 6, GroomID: 3, Ngay: daysFromToday(3), Gio: "09:00" },
  { ScheduleID: 17, HorseID: 2, GroomID: 13, Ngay: daysFromToday(4), Gio: "07:30" },
  { ScheduleID: 18, HorseID: 4, GroomID: 14, Ngay: daysFromToday(4), Gio: "08:00" },
  { ScheduleID: 19, HorseID: 1, GroomID: 3, Ngay: daysFromToday(5), Gio: "06:30" },
  { ScheduleID: 20, HorseID: 6, GroomID: 13, Ngay: daysFromToday(5), Gio: "09:00" },
  { ScheduleID: 21, HorseID: 5, GroomID: 14, Ngay: daysFromToday(5), Gio: "09:30" },
  { ScheduleID: 22, HorseID: 4, GroomID: 3, Ngay: daysFromToday(6), Gio: "08:00" },
  { ScheduleID: 23, HorseID: 2, GroomID: 13, Ngay: daysFromToday(7), Gio: "07:30" },
  { ScheduleID: 24, HorseID: 5, GroomID: 14, Ngay: daysFromToday(7), Gio: "09:30" },
  { ScheduleID: 25, HorseID: 1, GroomID: 3, Ngay: daysFromToday(8), Gio: "06:30" },
  { ScheduleID: 26, HorseID: 4, GroomID: 13, Ngay: daysFromToday(8), Gio: "08:00" },
  { ScheduleID: 27, HorseID: 2, GroomID: 14, Ngay: daysFromToday(9), Gio: "07:30" },
  { ScheduleID: 28, HorseID: 6, GroomID: 3, Ngay: daysFromToday(9), Gio: "09:00" },
  { ScheduleID: 29, HorseID: 1, GroomID: 13, Ngay: daysFromToday(10), Gio: "06:30" },
  { ScheduleID: 30, HorseID: 5, GroomID: 14, Ngay: daysFromToday(10), Gio: "09:30" },
  // Buổi chiều bổ sung (hôm nay +1 → +10): mỗi ngựa 2–3 buổi, chia đều 3 nhân viên, không xếp Storm (đang khóa tập)
  { ScheduleID: 31, HorseID: 6, GroomID: 3, Ngay: daysFromToday(2), Gio: "17:00" },
  { ScheduleID: 32, HorseID: 2, GroomID: 13, Ngay: daysFromToday(3), Gio: "15:30" },
  { ScheduleID: 33, HorseID: 4, GroomID: 14, Ngay: daysFromToday(3), Gio: "16:30" },
  { ScheduleID: 34, HorseID: 5, GroomID: 3, Ngay: daysFromToday(4), Gio: "15:00" },
  { ScheduleID: 35, HorseID: 1, GroomID: 13, Ngay: daysFromToday(4), Gio: "16:00" },
  { ScheduleID: 36, HorseID: 2, GroomID: 14, Ngay: daysFromToday(6), Gio: "15:30" },
  { ScheduleID: 37, HorseID: 6, GroomID: 3, Ngay: daysFromToday(6), Gio: "17:00" },
  { ScheduleID: 38, HorseID: 1, GroomID: 13, Ngay: daysFromToday(7), Gio: "16:00" },
  { ScheduleID: 39, HorseID: 4, GroomID: 14, Ngay: daysFromToday(7), Gio: "16:30" },
  { ScheduleID: 40, HorseID: 5, GroomID: 3, Ngay: daysFromToday(8), Gio: "15:00" },
  { ScheduleID: 41, HorseID: 6, GroomID: 13, Ngay: daysFromToday(8), Gio: "17:00" },
  { ScheduleID: 42, HorseID: 2, GroomID: 14, Ngay: daysFromToday(10), Gio: "15:30" },
];

export default trainingSchedules;
