import RaceRegistrationBoard from "../../components/RaceRegistrationBoard";

// Chủ ngựa > Thi đấu: đăng ký thi đấu của ngựa mình do huấn luyện viên gửi. Bấm "Xem" để Đồng ý / Từ chối (lý do bắt buộc).
// Chỉ xem được cuộc đua, ngày, lệ phí và tình trạng ngựa — không sửa. MOCK — services/raceRegistrationMock.js.
export default function OwnerRaces() {
  return (
    <div className="mx-auto w-full max-w-[1180px] md:px-8">
      <RaceRegistrationBoard
        title="Thi đấu"
        description="Đăng ký thi đấu của ngựa bạn, đang chờ hoặc đã có kết quả duyệt."
      />
    </div>
  );
}
