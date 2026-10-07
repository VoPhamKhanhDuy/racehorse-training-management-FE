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
];

export default trainingSchedules;
