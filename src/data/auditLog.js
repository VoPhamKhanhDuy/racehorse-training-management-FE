import { dateTimeFromToday, hoursFromNow } from "../utils/date";

// Mock data — bảng AUDITLOG (nhật ký thao tác) trong ERD
// UserID: người thực hiện (số, tham chiếu USER — xem utils/userId.js)
// TargetTable + TargetID: bản ghi bị tác động (USER, HORSE, SUPPLY, TRAININGPLAN, TRAININGSESSION, HEALTHSTATUS)
//   HEALTHSTATUS khóa theo HorseID nên TargetID là HorseID
// ThoiGian: "YYYY-MM-DDTHH:mm", tính tương đối theo lúc tải trang để demo luôn có hoạt động "vài giờ trước"
const auditLog = [
  { LogID: 1, UserID: 5, HanhDong: "Duyệt tài khoản chủ ngựa", TargetTable: "USER", TargetID: 7, ThoiGian: dateTimeFromToday(-26, "09:15") },
  { LogID: 2, UserID: 5, HanhDong: "Thêm hồ sơ ngựa", TargetTable: "HORSE", TargetID: 6, ThoiGian: dateTimeFromToday(-24, "14:40") },
  { LogID: 3, UserID: 1, HanhDong: "Tạo giáo án huấn luyện", TargetTable: "TRAININGPLAN", TargetID: 1, ThoiGian: dateTimeFromToday(-20, "08:05") },
  { LogID: 4, UserID: 5, HanhDong: "Tạo tài khoản nhân sự", TargetTable: "USER", TargetID: 12, ThoiGian: dateTimeFromToday(-18, "10:30") },
  { LogID: 5, UserID: 5, HanhDong: "Thêm vật tư", TargetTable: "SUPPLY", TargetID: 9, ThoiGian: dateTimeFromToday(-15, "16:20") },
  { LogID: 6, UserID: 2, HanhDong: "Cập nhật tình trạng sức khỏe", TargetTable: "HEALTHSTATUS", TargetID: 3, ThoiGian: dateTimeFromToday(-12, "11:00") },
  { LogID: 7, UserID: 3, HanhDong: "Nhập kho", TargetTable: "SUPPLY", TargetID: 1, ThoiGian: dateTimeFromToday(-9, "07:45") },
  { LogID: 8, UserID: 5, HanhDong: "Khóa tài khoản", TargetTable: "USER", TargetID: 12, ThoiGian: dateTimeFromToday(-8, "17:10") },
  { LogID: 9, UserID: 5, HanhDong: "Cập nhật hồ sơ ngựa", TargetTable: "HORSE", TargetID: 3, ThoiGian: dateTimeFromToday(-6, "13:25") },
  { LogID: 10, UserID: 2, HanhDong: "Xuất kho", TargetTable: "SUPPLY", TargetID: 5, ThoiGian: dateTimeFromToday(-5, "09:50") },
  { LogID: 11, UserID: 1, HanhDong: "Ghi nhận buổi tập", TargetTable: "TRAININGSESSION", TargetID: 2, ThoiGian: dateTimeFromToday(-2, "10:15") },
  { LogID: 12, UserID: 5, HanhDong: "Từ chối tài khoản chủ ngựa", TargetTable: "USER", TargetID: 11, ThoiGian: dateTimeFromToday(-2, "15:30") },
  { LogID: 13, UserID: 2, HanhDong: "Cập nhật tình trạng sức khỏe", TargetTable: "HEALTHSTATUS", TargetID: 5, ThoiGian: dateTimeFromToday(-1, "08:40") },
  { LogID: 14, UserID: 3, HanhDong: "Xuất kho", TargetTable: "SUPPLY", TargetID: 2, ThoiGian: dateTimeFromToday(-1, "06:20") },
  { LogID: 15, UserID: 5, HanhDong: "Sửa vật tư", TargetTable: "SUPPLY", TargetID: 4, ThoiGian: dateTimeFromToday(-1, "16:45") },
  { LogID: 16, UserID: 5, HanhDong: "Cập nhật tài khoản nhân sự", TargetTable: "USER", TargetID: 2, ThoiGian: hoursFromNow(-9) },
  { LogID: 17, UserID: 1, HanhDong: "Ghi nhận buổi tập", TargetTable: "TRAININGSESSION", TargetID: 6, ThoiGian: hoursFromNow(-5) },
  { LogID: 18, UserID: 2, HanhDong: "Nhập kho", TargetTable: "SUPPLY", TargetID: 6, ThoiGian: hoursFromNow(-2) },
  { LogID: 19, UserID: 5, HanhDong: "Duyệt tài khoản chủ ngựa", TargetTable: "USER", TargetID: 6, ThoiGian: hoursFromNow(-0.5) },
];

export default auditLog;
