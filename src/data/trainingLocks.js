import { daysFromToday } from "../utils/date";

// Mock data — bảng TRAININGLOCK (bác sĩ thú y khóa tập ngựa) trong ERD
// TODO: đối chiếu tên cột với ERD của nhóm (CLAUDE.md chưa định nghĩa TRAININGLOCK) — sửa ở đây nếu ERD đặt khác
// NgayGo: ngày gỡ khóa; null = đang khóa. LockedBy: UserID bác sĩ thú y (2 = vet@equitrack.vn)
const trainingLocks = [
  { LockID: 1, HorseID: 4, LyDo: "Viêm gân nhẹ chân trước", NgayKhoa: daysFromToday(-20), NgayGo: daysFromToday(-12), LockedBy: 2 },
  { LockID: 2, HorseID: 3, LyDo: "Chấn thương cổ chân sau", NgayKhoa: daysFromToday(-3), NgayGo: null, LockedBy: 2 },
];

export default trainingLocks;
