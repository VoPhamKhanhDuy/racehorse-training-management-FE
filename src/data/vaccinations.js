import { daysFromToday } from "../utils/date";

// Mock data — bảng VACCINATIONSCHEDULE (lịch tiêm phòng) trong ERD: ScheduleID, HorseID, Loai, NgayHen, TrangThai
// TrangThai: "Đã tiêm" | "Chờ tiêm" | "Quá hạn". NgayHen tương đối so với hôm nay.
// Demo: Spirit có đúng 1 mũi "Quá hạn"; mỗi ngựa có 1 mũi "Chờ tiêm" sắp tới.
const vaccinations = [
  { ScheduleID: 1, HorseID: 1, Loai: "Cúm ngựa", NgayHen: daysFromToday(-40), TrangThai: "Đã tiêm" },
  { ScheduleID: 2, HorseID: 1, Loai: "Uốn ván", NgayHen: daysFromToday(12), TrangThai: "Chờ tiêm" },
  { ScheduleID: 3, HorseID: 2, Loai: "Uốn ván", NgayHen: daysFromToday(-60), TrangThai: "Đã tiêm" },
  { ScheduleID: 4, HorseID: 2, Loai: "Cúm ngựa", NgayHen: daysFromToday(-15), TrangThai: "Đã tiêm" },
  { ScheduleID: 5, HorseID: 2, Loai: "Viêm não Nhật Bản", NgayHen: daysFromToday(20), TrangThai: "Chờ tiêm" },
  { ScheduleID: 6, HorseID: 3, Loai: "Cúm ngựa", NgayHen: daysFromToday(-90), TrangThai: "Đã tiêm" },
  { ScheduleID: 7, HorseID: 3, Loai: "Uốn ván", NgayHen: daysFromToday(25), TrangThai: "Chờ tiêm" },
  { ScheduleID: 8, HorseID: 4, Loai: "Uốn ván", NgayHen: daysFromToday(-30), TrangThai: "Đã tiêm" },
  { ScheduleID: 9, HorseID: 4, Loai: "Cúm ngựa", NgayHen: daysFromToday(-10), TrangThai: "Đã tiêm" },
  { ScheduleID: 10, HorseID: 4, Loai: "Viêm não Nhật Bản", NgayHen: daysFromToday(45), TrangThai: "Chờ tiêm" },
  { ScheduleID: 11, HorseID: 5, Loai: "Cúm ngựa", NgayHen: daysFromToday(-50), TrangThai: "Đã tiêm" },
  { ScheduleID: 12, HorseID: 5, Loai: "Uốn ván", NgayHen: daysFromToday(8), TrangThai: "Chờ tiêm" },
  { ScheduleID: 13, HorseID: 6, Loai: "Uốn ván", NgayHen: daysFromToday(-100), TrangThai: "Đã tiêm" },
  { ScheduleID: 14, HorseID: 6, Loai: "Cúm ngựa", NgayHen: daysFromToday(-6), TrangThai: "Quá hạn" },
  { ScheduleID: 15, HorseID: 6, Loai: "Viêm não Nhật Bản", NgayHen: daysFromToday(30), TrangThai: "Chờ tiêm" },
];

export default vaccinations;
