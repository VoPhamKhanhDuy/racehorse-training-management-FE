import { daysFromToday } from "../utils/date";

// Mock data — bảng RACE (giải đua) trong ERD: RaceID, TenGiai, Ngay, DiaDiem
// Ngày tương đối so với hôm nay: 2 giải đã diễn ra (1, 6), 4 giải sắp tới. Màn Đăng ký thi đấu chỉ đọc bảng này.
const races = [
  { RaceID: 6, TenGiai: "Cúp Tam Đảo Mở Rộng", Ngay: daysFromToday(-24), DiaDiem: "Trường đua Tam Đảo, Vĩnh Phúc" },
  { RaceID: 1, TenGiai: "Giải Đua Ngựa Mùa Thu", Ngay: daysFromToday(-9), DiaDiem: "Trường đua Phú Thọ, TP. Hồ Chí Minh" },
  { RaceID: 2, TenGiai: "Cúp Đua Ngựa Thành Phố", Ngay: daysFromToday(6), DiaDiem: "Trường đua Đại Nam, Bình Dương" },
  { RaceID: 3, TenGiai: "Giải Vô Địch Câu Lạc Bộ", Ngay: daysFromToday(15), DiaDiem: "Trường đua Thiên Mã, Đà Lạt" },
  { RaceID: 4, TenGiai: "Cúp Đồng Bằng Sông Cửu Long", Ngay: daysFromToday(27), DiaDiem: "Sân đua Ninh Kiều, Cần Thơ" },
  { RaceID: 5, TenGiai: "Giải Đua Ngựa Mừng Xuân", Ngay: daysFromToday(45), DiaDiem: "Trường đua Sóc Sơn, Hà Nội" },
];

export default races;
