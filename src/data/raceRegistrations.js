import { daysFromToday } from "../utils/date";

// Mock data — bảng RACEREGISTRATION (đăng ký thi đấu) trong ERD: HorseID, RaceID, NgayDangKy
// Khóa chính ghép HorseID + RaceID (1 ngựa không đăng ký trùng 1 giải).
// Demo: giải đã qua có 2 ngựa; giải +6 có Blaze + Lightning; giải +15 có Storm (đăng ký trước khi bị khóa tập);
// 2 giải còn lại để trống.
const raceRegistrations = [
  { HorseID: 1, RaceID: 1, NgayDangKy: daysFromToday(-30) },
  { HorseID: 6, RaceID: 1, NgayDangKy: daysFromToday(-28) },
  { HorseID: 4, RaceID: 2, NgayDangKy: daysFromToday(-12) },
  { HorseID: 2, RaceID: 2, NgayDangKy: daysFromToday(-8) },
  { HorseID: 3, RaceID: 3, NgayDangKy: daysFromToday(-6) },
];

export default raceRegistrations;
