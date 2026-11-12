import RaceRegistrationBoard from "../../components/RaceRegistrationBoard";

// Chủ ngựa > Thi đấu: duyệt đăng ký qua /api/approvals/races + xem kết quả từ /api/races/registrations.
export default function OwnerRaces() {
  return (
    <div className="mx-auto w-full max-w-[1180px] md:px-8">
      <RaceRegistrationBoard
        title="Thi đấu"
        description="Đăng ký thi đấu của ngựa bạn, đang chờ duyệt hoặc đã có kết quả."
      />
    </div>
  );
}
