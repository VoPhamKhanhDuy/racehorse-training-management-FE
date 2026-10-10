import thunderPhoto from "../assets/images/horses/thunder.jpg";
import lightningPhoto from "../assets/images/horses/lightning.jpg";
import stormPhoto from "../assets/images/horses/storm.jpg";
import blazePhoto from "../assets/images/horses/blaze.jpg";
import shadowPhoto from "../assets/images/horses/shadow.jpg";
import spiritPhoto from "../assets/images/horses/spirit.jpg";

// Mock data — khớp bảng HORSE trong ERD
// OwnerID tham chiếu USER có roleId "horse_owner" (4, 6, 7 ↔ U004, U006, U007 trong users.js)
// photo: ảnh ngựa phía FE — ERD hiện CHƯA có cột ảnh, cần bổ sung vào bảng HORSE khi làm BE
// photoPosition (tùy chọn, chỉ phía FE): object-position khi cắt ảnh vào khung vuông; mặc định "center 30%"
const horses = [
  { HorseID: 1, Ten: "Thunder", Giong: "Thoroughbred", Tuoi: 4, CanNang: 450, DongDoi: "Northern Dancer", OwnerID: 4, photo: thunderPhoto },
  { HorseID: 2, Ten: "Lightning", Giong: "Thoroughbred", Tuoi: 5, CanNang: 470, DongDoi: "Mr. Prospector", OwnerID: 6, photo: lightningPhoto },
  { HorseID: 3, Ten: "Storm", Giong: "Arabian", Tuoi: 3, CanNang: 410, DongDoi: "Bask", OwnerID: 6, photo: stormPhoto, photoPosition: "100% 30%" }, // ảnh có người đứng mép trái → lệch khung sang phải
  { HorseID: 4, Ten: "Blaze", Giong: "Quarter Horse", Tuoi: 6, CanNang: 500, DongDoi: "Three Bars", OwnerID: 7, photo: blazePhoto },
  { HorseID: 5, Ten: "Shadow", Giong: "Thoroughbred", Tuoi: 4, CanNang: 460, DongDoi: "Northern Dancer", OwnerID: 4, photo: shadowPhoto },
  { HorseID: 6, Ten: "Spirit", Giong: "Arabian", Tuoi: 5, CanNang: 420, DongDoi: "Raffles", OwnerID: 7, photo: spiritPhoto },
];

export default horses;
