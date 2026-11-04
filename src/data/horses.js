import thunderPhoto from "../assets/images/horses/thunder.jpg";
import lightningPhoto from "../assets/images/horses/lightning.jpg";
import stormPhoto from "../assets/images/horses/storm.jpg";
import blazePhoto from "../assets/images/horses/blaze.jpg";
import shadowPhoto from "../assets/images/horses/shadow.jpg";
import spiritPhoto from "../assets/images/horses/spirit.jpg";
import { monthsFromToday } from "../utils/date";

// Ngày sinh cách hôm nay đúng `years` năm + 3 tháng → tuổi tính ra (getHorseAge) ổn định trong nhiều tháng
const bornYearsAgo = (years) => monthsFromToday(-(years * 12 + 3));

// Mock data — khớp bảng HORSE trong ERD: HorseID, Ten, Giong, NgaySinh, GioiTinh, MauLong, CanNang, DongDoi, OwnerID
// Tuổi KHÔNG lưu — luôn tính từ NgaySinh bằng getHorseAge (utils/date.js)
// GioiTinh: "Ngựa đực" | "Ngựa cái" | "Ngựa thiến" (HORSE_GENDERS trong data/horseOptions.js)
// OwnerID tham chiếu USER có roleId "horse_owner" (4, 6, 7 ↔ U004, U006, U007 trong users.js)
// Demo trang "Ngựa của tôi": U004 (owner@equitrack.vn) có 3 ngựa — Thunder (khỏe, có thành tích), Shadow, Storm (đang khóa tập)
// photo: ảnh ngựa phía FE — ERD hiện CHƯA có cột ảnh, cần bổ sung vào bảng HORSE khi làm BE
// photoPosition (tùy chọn, chỉ phía FE): object-position khi cắt ảnh vào khung vuông; mặc định "center 30%"
const horses = [
  { HorseID: 1, Ten: "Thunder", Giong: "Thoroughbred", NgaySinh: bornYearsAgo(4), GioiTinh: "Ngựa thiến", MauLong: "Hạt dẻ", CanNang: 450, DongDoi: "Northern Dancer", OwnerID: 4, photo: thunderPhoto },
  { HorseID: 2, Ten: "Lightning", Giong: "Thoroughbred", NgaySinh: bornYearsAgo(5), GioiTinh: "Ngựa cái", MauLong: "Xám", CanNang: 470, DongDoi: "Mr. Prospector", OwnerID: 6, photo: lightningPhoto },
  { HorseID: 3, Ten: "Storm", Giong: "Arabian", NgaySinh: bornYearsAgo(3), GioiTinh: "Ngựa đực", MauLong: "Nâu sẫm", CanNang: 410, DongDoi: "Bask", OwnerID: 4, photo: stormPhoto, photoPosition: "100% 30%" }, // ảnh có người đứng mép trái → lệch khung sang phải
  { HorseID: 4, Ten: "Blaze", Giong: "Quarter Horse", NgaySinh: bornYearsAgo(6), GioiTinh: "Ngựa đực", MauLong: "Nâu", CanNang: 500, DongDoi: "Three Bars", OwnerID: 7, photo: blazePhoto },
  { HorseID: 5, Ten: "Shadow", Giong: "Thoroughbred", NgaySinh: bornYearsAgo(4), GioiTinh: "Ngựa đực", MauLong: "Nâu sẫm", CanNang: 460, DongDoi: "Northern Dancer", OwnerID: 4, photo: shadowPhoto },
  { HorseID: 6, Ten: "Spirit", Giong: "Arabian", NgaySinh: bornYearsAgo(5), GioiTinh: "Ngựa cái", MauLong: "Hạt dẻ", CanNang: 420, DongDoi: "Raffles", OwnerID: 7, photo: spiritPhoto },
];

export default horses;
