import { daysFromToday } from "../utils/date";

// Mock data — khớp bảng TRAININGSCHEDULE trong ERD
// GroomID: người thực hiện lịch (3 = Nhân viên chăm sóc), không phải HLV
// Ngay tính tương đối theo hôm nay để demo lúc nào cũng có lịch "hôm nay"
const trainingSchedules = [
  { ScheduleID: 1, HorseID: 1, GroomID: 3, Ngay: daysFromToday(-1), Gio: "06:30" },
  { ScheduleID: 2, HorseID: 1, GroomID: 3, Ngay: daysFromToday(0), Gio: "06:30" },
  { ScheduleID: 3, HorseID: 2, GroomID: 3, Ngay: daysFromToday(0), Gio: "07:30" },
  { ScheduleID: 4, HorseID: 6, GroomID: 3, Ngay: daysFromToday(0), Gio: "09:00" },
  { ScheduleID: 5, HorseID: 4, GroomID: 3, Ngay: daysFromToday(1), Gio: "08:00" },
  { ScheduleID: 6, HorseID: 2, GroomID: 3, Ngay: daysFromToday(1), Gio: "07:30" },
  // Lịch đã qua: 12 lịch có buổi tập tương ứng + 2 lịch bỏ lỡ (ScheduleID 19, 20) — dùng tính tỷ lệ hoàn thành
  { ScheduleID: 7, HorseID: 1, GroomID: 3, Ngay: daysFromToday(-3), Gio: "06:30" },
  { ScheduleID: 8, HorseID: 1, GroomID: 3, Ngay: daysFromToday(-5), Gio: "06:30" },
  { ScheduleID: 9, HorseID: 1, GroomID: 3, Ngay: daysFromToday(-8), Gio: "06:30" },
  { ScheduleID: 10, HorseID: 2, GroomID: 3, Ngay: daysFromToday(-4), Gio: "07:30" },
  { ScheduleID: 11, HorseID: 2, GroomID: 3, Ngay: daysFromToday(-6), Gio: "07:30" },
  { ScheduleID: 12, HorseID: 2, GroomID: 3, Ngay: daysFromToday(-9), Gio: "07:30" },
  { ScheduleID: 13, HorseID: 6, GroomID: 3, Ngay: daysFromToday(-3), Gio: "09:00" },
  { ScheduleID: 14, HorseID: 6, GroomID: 3, Ngay: daysFromToday(-7), Gio: "09:00" },
  { ScheduleID: 15, HorseID: 4, GroomID: 3, Ngay: daysFromToday(-5), Gio: "08:00" },
  { ScheduleID: 16, HorseID: 4, GroomID: 3, Ngay: daysFromToday(-10), Gio: "08:00" },
  { ScheduleID: 17, HorseID: 5, GroomID: 3, Ngay: daysFromToday(-6), Gio: "09:30" },
  { ScheduleID: 18, HorseID: 3, GroomID: 3, Ngay: daysFromToday(-4), Gio: "08:30" },
  { ScheduleID: 19, HorseID: 3, GroomID: 3, Ngay: daysFromToday(-8), Gio: "08:30" },
  { ScheduleID: 20, HorseID: 5, GroomID: 3, Ngay: daysFromToday(-3), Gio: "09:30" },
];

export default trainingSchedules;
