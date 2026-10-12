import { CARE_TASK_SCHEDULE } from "../config/careTaskSchedule";

// Mock data — bảng STABLEASSIGNMENT (phân chuồng) trong ERD: StableID, HorseID, SoChuong, LichSinhHoat
// Mỗi ngựa 1 chuồng (A1–A3, B1–B3). LichSinhHoat: chuỗi nhiều dòng "HH:mm Việc" — giờ lấy từ config/careTaskSchedule.js
// để luôn khớp giờ chuẩn của các loại việc; "Kiểm tra chuồng" (20:00) là mốc cuối ngày chưa có trong cấu hình việc.
// Các ngựa khác nhau chút ít (vd Thunder thêm dắt đi bộ, Storm đang nghỉ nên không tắm/kiểm tra móng).
const time = (loaiViec) => CARE_TASK_SCHEDULE[loaiViec].gio;
const EVENING_CHECK = { gio: "20:00", viec: "Kiểm tra chuồng" };

// Mỗi mục: [LoaiViec trong cấu hình, nhãn hiển thị]
const FEED_AM = ["Cho ăn buổi sáng", "Cho ăn sáng"];
const CLEAN = ["Dọn chuồng", "Dọn chuồng"];
const WASH = ["Tắm và chải lông", "Tắm và chải lông"];
const HOOF = ["Kiểm tra móng", "Kiểm tra móng"];
const FEED_PM = ["Cho ăn buổi chiều", "Cho ăn chiều"];

// Dựng chuỗi nhiều dòng; extra: các mốc thêm { gio, viec }; tất cả được sắp theo giờ
const schedule = (items, extra = []) =>
  [...items.map(([loaiViec, nhan]) => ({ gio: time(loaiViec), viec: nhan })), ...extra, EVENING_CHECK]
    .sort((a, b) => a.gio.localeCompare(b.gio))
    .map((s) => `${s.gio} ${s.viec}`)
    .join("\n");

const stableAssignments = [
  { StableID: 1, HorseID: 1, SoChuong: "A1", LichSinhHoat: schedule([FEED_AM, CLEAN, HOOF, FEED_PM], [{ gio: "12:30", viec: "Dắt đi bộ" }]) }, // Thunder
  { StableID: 2, HorseID: 2, SoChuong: "A2", LichSinhHoat: schedule([FEED_AM, CLEAN, WASH, HOOF, FEED_PM]) }, // Lightning
  { StableID: 3, HorseID: 3, SoChuong: "A3", LichSinhHoat: schedule([FEED_AM, CLEAN, FEED_PM]) }, // Storm — đang nghỉ
  { StableID: 4, HorseID: 4, SoChuong: "B1", LichSinhHoat: schedule([FEED_AM, CLEAN, WASH, HOOF, FEED_PM]) }, // Blaze
  { StableID: 5, HorseID: 5, SoChuong: "B2", LichSinhHoat: schedule([FEED_AM, CLEAN, HOOF, FEED_PM], [{ gio: "16:00", viec: "Chải lông" }]) }, // Shadow
  { StableID: 6, HorseID: 6, SoChuong: "B3", LichSinhHoat: schedule([FEED_AM, CLEAN, WASH, FEED_PM]) }, // Spirit
];

export default stableAssignments;
