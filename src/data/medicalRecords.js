import { daysFromToday } from "../utils/date";

// Mock data — bảng MEDICALRECORD (hồ sơ khám bệnh do bác sĩ thú y ghi) trong ERD
// TODO: đối chiếu tên cột với ERD của nhóm (CLAUDE.md chưa định nghĩa MEDICALRECORD) — sửa ở đây nếu ERD đặt khác
// Phân quyền: HLV trưởng chỉ được biết ngày khám (Ngay); ChanDoan / PhacDo / ViTriChanThuong chỉ bác sĩ thú y xem.
const medicalRecords = [
  { RecordID: 1, HorseID: 1, Ngay: daysFromToday(-35), ChanDoan: "Khám định kỳ, không phát hiện bất thường", PhacDo: "Không", ViTriChanThuong: null },
  { RecordID: 2, HorseID: 1, Ngay: daysFromToday(-14), ChanDoan: "Khám định kỳ, không phát hiện bất thường", PhacDo: "Không", ViTriChanThuong: null },
  { RecordID: 3, HorseID: 2, Ngay: daysFromToday(-21), ChanDoan: "Khám định kỳ, không phát hiện bất thường", PhacDo: "Không", ViTriChanThuong: null },
  { RecordID: 4, HorseID: 3, Ngay: daysFromToday(-30), ChanDoan: "Khám định kỳ, không phát hiện bất thường", PhacDo: "Không", ViTriChanThuong: null },
  { RecordID: 5, HorseID: 3, Ngay: daysFromToday(-3), ChanDoan: "Tổn thương phần mềm", PhacDo: "Nghỉ tập, chườm lạnh, tái khám", ViTriChanThuong: "Cổ chân sau" },
  { RecordID: 6, HorseID: 4, Ngay: daysFromToday(-20), ChanDoan: "Viêm nhẹ", PhacDo: "Nghỉ tập, theo dõi", ViTriChanThuong: "Chân trước" },
  { RecordID: 7, HorseID: 4, Ngay: daysFromToday(-12), ChanDoan: "Tái khám, đã hồi phục", PhacDo: "Tập lại cường độ thấp", ViTriChanThuong: null },
  { RecordID: 8, HorseID: 5, Ngay: daysFromToday(-28), ChanDoan: "Khám định kỳ, không phát hiện bất thường", PhacDo: "Không", ViTriChanThuong: null },
  { RecordID: 9, HorseID: 6, Ngay: daysFromToday(0), ChanDoan: "Cần theo dõi thêm", PhacDo: "Theo dõi, tái khám", ViTriChanThuong: null },
];

export default medicalRecords;
