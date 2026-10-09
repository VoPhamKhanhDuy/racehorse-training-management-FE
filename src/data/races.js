import { daysFromToday } from "../utils/date";

// Mock data — bảng RACE (giải đua) trong ERD
// TODO: đối chiếu tên cột với ERD của nhóm (CLAUDE.md chưa định nghĩa RACE) — sửa ở đây nếu ERD đặt khác
// CuLy: mét. Ngay tính tương đối theo hôm nay: 2 giải đã diễn ra, 1 giải sắp tới
const races = [
  { RaceID: 1, TenGiai: "Cúp Mùa Hè Đà Lạt", Ngay: daysFromToday(-45), DiaDiem: "Đà Lạt", CuLy: 1400 },
  { RaceID: 2, TenGiai: "Giải Đua Mùa Thu Phú Thọ", Ngay: daysFromToday(-18), DiaDiem: "TP. Hồ Chí Minh", CuLy: 1600 },
  { RaceID: 3, TenGiai: "Giải Vô địch Quốc gia", Ngay: daysFromToday(15), DiaDiem: "Hà Nội", CuLy: 2000 },
];

export default races;
