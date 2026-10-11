import { daysFromToday } from "../utils/date";

// Mock data — bảng TRAININGLOCK (bác sĩ thú y khóa tập ngựa) trong ERD
// Cột theo ERD: LockID, HorseID, VetID, LyDo, NgayDat, NgayGo
// NgayDat: ngày đặt lệnh khóa; NgayGo: ngày gỡ khóa, null = đang khóa. VetID: UserID bác sĩ thú y đặt lệnh (2 = Trần Quốc Bảo). Lệnh khóa Storm cùng ngày bệnh án viêm gân (medicalRecords.js)
const trainingLocks = [
  { LockID: 1, HorseID: 4, LyDo: "Viêm gân nhẹ chân trước", NgayDat: daysFromToday(-20), NgayGo: daysFromToday(-12), VetID: 2 },
  { LockID: 2, HorseID: 3, LyDo: "Viêm gân gấp chân trước trái", NgayDat: daysFromToday(-12), NgayGo: null, VetID: 2 },
];

export default trainingLocks;
