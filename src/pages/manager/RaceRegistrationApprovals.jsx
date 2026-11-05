import RaceRegistrationBoard from "../../components/RaceRegistrationBoard";

// Quản lý CLB > Đăng ký thi đấu: bước duyệt cuối, sau khi chủ ngựa đã đồng ý. Bấm "Xem" để Duyệt / Từ chối (lý do bắt buộc).
// Khối "Tình trạng ngựa" trong khung chi tiết cảnh báo khi ngựa đang khóa tập / chưa đủ điều kiện nhưng không chặn việc duyệt.
// MOCK — services/raceRegistrationMock.js.
export default function RaceRegistrationApprovals() {
  return (
    <RaceRegistrationBoard
      title="Đăng ký thi đấu"
      description="Duyệt cuối các đăng ký thi đấu đã được chủ ngựa đồng ý."
    />
  );
}
