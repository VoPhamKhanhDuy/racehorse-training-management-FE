import { daysFromToday } from "../utils/date";

// Mock data — bảng VACCINATIONSCHEDULE (lịch tiêm phòng) trong ERD: ScheduleID, HorseID, Loai, NgayHen, TrangThai
// Loai: tiêm phòng hoặc tẩy giun (gợi ý ở data/vaccinationOptions.js). NgayHen tương đối so với hôm nay.
// TrangThai CHỈ LƯU "Chờ tiêm" | "Đã tiêm". "Quá hạn" / "Sắp tới" là trạng thái hiển thị, tính bằng getVaccineState (utils/healthAlerts.js).
// Demo: Spirit Cúm ngựa quá hạn 3 ngày; Shadow Viêm não Nhật Bản quá hạn 5 ngày (trang Sức khỏe của chủ ngựa demo); Thunder (+4) và Blaze (+6) sắp tới; Lightning tẩy giun còn 45 ngày;
// đã tiêm trong 60 ngày qua: Thunder, Lightning, Blaze, Shadow (+ tẩy giun Storm, Shadow).
// Ma trận ngựa × loại có ô trống thật: Dại chỉ 4/6 ngựa, Viêm não Nhật Bản 3/6, Tẩy giun 3/6.
const vaccinations = [
  { ScheduleID: 1, HorseID: 1, Loai: "Cúm ngựa", NgayHen: daysFromToday(-40), TrangThai: "Đã tiêm" },
  { ScheduleID: 2, HorseID: 1, Loai: "Uốn ván", NgayHen: daysFromToday(4), TrangThai: "Chờ tiêm" },
  { ScheduleID: 3, HorseID: 2, Loai: "Uốn ván", NgayHen: daysFromToday(-60), TrangThai: "Đã tiêm" },
  { ScheduleID: 4, HorseID: 2, Loai: "Cúm ngựa", NgayHen: daysFromToday(-15), TrangThai: "Đã tiêm" },
  { ScheduleID: 5, HorseID: 2, Loai: "Viêm não Nhật Bản", NgayHen: daysFromToday(-75), TrangThai: "Đã tiêm" },
  { ScheduleID: 6, HorseID: 3, Loai: "Cúm ngựa", NgayHen: daysFromToday(-90), TrangThai: "Đã tiêm" },
  { ScheduleID: 7, HorseID: 3, Loai: "Uốn ván", NgayHen: daysFromToday(-130), TrangThai: "Đã tiêm" },
  { ScheduleID: 8, HorseID: 4, Loai: "Uốn ván", NgayHen: daysFromToday(-30), TrangThai: "Đã tiêm" },
  { ScheduleID: 9, HorseID: 4, Loai: "Cúm ngựa", NgayHen: daysFromToday(-10), TrangThai: "Đã tiêm" },
  { ScheduleID: 10, HorseID: 4, Loai: "Viêm não Nhật Bản", NgayHen: daysFromToday(6), TrangThai: "Chờ tiêm" },
  { ScheduleID: 11, HorseID: 5, Loai: "Cúm ngựa", NgayHen: daysFromToday(-50), TrangThai: "Đã tiêm" },
  { ScheduleID: 12, HorseID: 5, Loai: "Uốn ván", NgayHen: daysFromToday(-95), TrangThai: "Đã tiêm" },
  { ScheduleID: 13, HorseID: 6, Loai: "Uốn ván", NgayHen: daysFromToday(-100), TrangThai: "Đã tiêm" },
  { ScheduleID: 14, HorseID: 6, Loai: "Cúm ngựa", NgayHen: daysFromToday(-3), TrangThai: "Chờ tiêm" }, // quá hạn 3 ngày
  { ScheduleID: 15, HorseID: 6, Loai: "Viêm não Nhật Bản", NgayHen: daysFromToday(-160), TrangThai: "Đã tiêm" },
  { ScheduleID: 16, HorseID: 2, Loai: "Tẩy giun", NgayHen: daysFromToday(45), TrangThai: "Chờ tiêm" },
  { ScheduleID: 17, HorseID: 1, Loai: "Dại", NgayHen: daysFromToday(-70), TrangThai: "Đã tiêm" },
  { ScheduleID: 18, HorseID: 2, Loai: "Dại", NgayHen: daysFromToday(-85), TrangThai: "Đã tiêm" },
  { ScheduleID: 19, HorseID: 4, Loai: "Dại", NgayHen: daysFromToday(-120), TrangThai: "Đã tiêm" },
  { ScheduleID: 20, HorseID: 6, Loai: "Dại", NgayHen: daysFromToday(-65), TrangThai: "Đã tiêm" },
  { ScheduleID: 21, HorseID: 3, Loai: "Tẩy giun", NgayHen: daysFromToday(-25), TrangThai: "Đã tiêm" },
  { ScheduleID: 22, HorseID: 5, Loai: "Tẩy giun", NgayHen: daysFromToday(-18), TrangThai: "Đã tiêm" },
  { ScheduleID: 23, HorseID: 5, Loai: "Viêm não Nhật Bản", NgayHen: daysFromToday(-5), TrangThai: "Chờ tiêm" }, // quá hạn 5 ngày
];

export default vaccinations;
