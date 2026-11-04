import { daysFromToday } from "../utils/date";

// Mock data — bảng MEDICALRECORD (bệnh án, mỗi lần khám bệnh 1 bản ghi) trong ERD:
// RecordID, HorseID, VetID, ChanDoan, PhacDo, ViTriChanThuong, Ngay
// VetID: UserID bác sĩ thú y ghi bệnh án (2 = Trần Quốc Bảo, 15 = Lê Thị Minh Châu)
// ViTriChanThuong: các vị trí nối bằng ", " (INJURY_LOCATIONS) hoặc đúng chuỗi "Không có chấn thương"
// KHÔNG lưu tình trạng sức khỏe ở đây — tình trạng hiện tại nằm ở HEALTHSTATUS.
// Phân quyền: HLV trưởng chỉ được biết ngày khám (Ngay); ChanDoan / PhacDo / ViTriChanThuong chỉ bác sĩ thú y xem.
// Demo trong 60 ngày gần đây: Storm viêm gân (−12, cùng ngày đặt lệnh khóa); Spirit sưng khớp (hôm nay);
// Blaze khám lại sau đợt nghỉ (−12, cùng ngày gỡ lệnh khóa cũ) — "Ngày khám gần nhất" ở hồ sơ HLV.
const medicalRecords = [
  { RecordID: 1, HorseID: 5, VetID: 2, Ngay: daysFromToday(-55), ChanDoan: "Khám sức khỏe định kỳ, chỉ số bình thường", PhacDo: "Duy trì khẩu phần và lịch tập hiện tại. Khám lại sau 4 tuần.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 2, HorseID: 1, VetID: 2, Ngay: daysFromToday(-52), ChanDoan: "Khám định kỳ đầu mùa, tim phổi và hệ vận động ổn định", PhacDo: "Không cần điều trị. Bổ sung điện giải sau các buổi tập dài trên 1.600 m.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 3, HorseID: 2, VetID: 15, Ngay: daysFromToday(-45), ChanDoan: "Kiểm tra tổng quát, răng mòn không đều nhẹ", PhacDo: "Mài răng định kỳ trong tuần tới. Theo dõi khả năng nhai và lượng thức ăn thừa.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 4, HorseID: 4, VetID: 15, Ngay: daysFromToday(-40), ChanDoan: "Khám sức khỏe định kỳ, nhịp tim nghỉ 34 bpm", PhacDo: "Tiếp tục giáo án hiện tại. Kiểm tra lại móng sau 2 tuần do mặt sân cát ẩm.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 5, HorseID: 3, VetID: 2, Ngay: daysFromToday(-38), ChanDoan: "Khám định kỳ, thể trạng tốt, lông mượt", PhacDo: "Giữ khẩu phần, tăng dần khối lượng tập theo giáo án Nền tảng.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 6, HorseID: 6, VetID: 15, Ngay: daysFromToday(-33), ChanDoan: "Khám trước giai đoạn Tiền giải, phản xạ tốt", PhacDo: "Đủ điều kiện tăng cường độ. Đo lại nhịp tim hồi phục sau 2 tuần.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 7, HorseID: 1, VetID: 15, Ngay: daysFromToday(-30), ChanDoan: "Tái khám định kỳ, hồi phục nhịp tim sau tập nhanh", PhacDo: "Không cần điều trị. Giữ thời gian thả lỏng tối thiểu 15 phút sau bài chạy.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 8, HorseID: 5, VetID: 15, Ngay: daysFromToday(-28), ChanDoan: "Khám định kỳ, cân nặng tăng nhẹ 6 kg so với tháng trước", PhacDo: "Giảm 10% lượng ngũ cốc, giữ cỏ khô. Cân lại sau 2 tuần.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 9, HorseID: 2, VetID: 2, Ngay: daysFromToday(-18), ChanDoan: "Khám sức khỏe định kỳ, hô hấp và tiêu hóa bình thường", PhacDo: "Tiếp tục giáo án Tăng tốc. Tiêm nhắc cúm ngựa theo lịch.", ViTriChanThuong: "Không có chấn thương" },
  {
    RecordID: 10,
    HorseID: 3,
    VetID: 2,
    Ngay: daysFromToday(-12),
    ChanDoan: "Viêm gân gấp chân trước trái",
    PhacDo:
      "Nghỉ tập hoàn toàn 3 tuần, chỉ dắt bộ 10 phút mỗi ngày. Chườm lạnh vùng gân 20 phút, 2 lần/ngày trong 7 ngày đầu. Phenylbutazone 2,2 mg/kg uống 2 lần/ngày trong 5 ngày, sau đó giảm còn 1 lần/ngày. Băng ép chân trước trái khi nghỉ trong chuồng. Siêu âm tái khám sau 14 ngày để đánh giá mức hồi phục trước khi cho tập lại.",
    ViTriChanThuong: "Chân trước trái, Gân",
  },
  { RecordID: 11, HorseID: 4, VetID: 2, Ngay: daysFromToday(-12), ChanDoan: "Khám lại sau đợt nghỉ, gân chân trước đã ổn, chỉ số bình thường", PhacDo: "Gỡ khóa tập. Tập lại cường độ thấp trong 1 tuần (giáo án Phục hồi) rồi mới tăng tải.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 12, HorseID: 5, VetID: 15, Ngay: daysFromToday(-8), ChanDoan: "Khám định kỳ, cơ lưng hơi căng sau chuỗi bài sân sỏi", PhacDo: "Xoa bóp cơ lưng 2 lần/tuần, ưu tiên mặt sân cát trong 10 ngày tới.", ViTriChanThuong: "Không có chấn thương" },
  { RecordID: 13, HorseID: 1, VetID: 2, Ngay: daysFromToday(-5), ChanDoan: "Khám nhanh trước giai đoạn Tiền giải, không phát hiện bất thường", PhacDo: "Đủ điều kiện tập cường độ cao. Theo dõi nhiệt độ cơ thể sáng sớm trong tuần đầu.", ViTriChanThuong: "Không có chấn thương" },
  {
    RecordID: 14,
    HorseID: 6,
    VetID: 15,
    Ngay: daysFromToday(0),
    ChanDoan: "Sưng nhẹ khớp cổ chân sau phải",
    PhacDo:
      "Giảm khối lượng tập 50% trong 5 ngày, tránh bài chạy nước rút. Chườm lạnh sau mỗi buổi tập. Theo dõi nhiệt độ và độ sưng khớp mỗi sáng; nếu sưng tăng hoặc ngựa đi khập khiễng thì ngừng tập và báo bác sĩ. Tái khám sau 5 ngày.",
    ViTriChanThuong: "Chân sau phải, Khớp",
  },
];

export default medicalRecords;
