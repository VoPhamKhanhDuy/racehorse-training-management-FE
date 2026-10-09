// Mock data — bảng RACEREGISTRATION (đăng ký thi đấu) trong ERD
// TODO: đối chiếu tên cột với ERD của nhóm (CLAUDE.md chưa định nghĩa RACEREGISTRATION)
// ThuHang: thứ hạng về đích; null = giải chưa diễn ra
const raceRegistrations = [
  { RegistrationID: 1, RaceID: 1, HorseID: 1, ThuHang: 2 },
  { RegistrationID: 2, RaceID: 1, HorseID: 4, ThuHang: 5 },
  { RegistrationID: 3, RaceID: 2, HorseID: 1, ThuHang: 1 },
  { RegistrationID: 4, RaceID: 2, HorseID: 2, ThuHang: 3 },
  { RegistrationID: 5, RaceID: 2, HorseID: 6, ThuHang: 2 },
  { RegistrationID: 6, RaceID: 3, HorseID: 1, ThuHang: null },
  { RegistrationID: 7, RaceID: 3, HorseID: 3, ThuHang: null },
];

export default raceRegistrations;
