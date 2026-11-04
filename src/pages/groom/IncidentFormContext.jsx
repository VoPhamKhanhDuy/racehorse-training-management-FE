import HorseAvatar from "../../components/HorseAvatar";

// Thẻ ngữ cảnh bên phải form gửi báo cáo sự cố: ảnh + tên ngựa đang chọn, số chuồng, dòng nhắc ai sẽ nhận báo cáo.
export default function IncidentFormContext({ horse, stable }) {
  return (
    <div className="space-y-4">
      {horse ? (
        <div className="flex min-w-0 items-center gap-4">
          <HorseAvatar horse={horse} size={56} />
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-semibold text-ink">{horse.Ten}</h2>
            <p className="text-sm text-stone">{stable ? `Chuồng ${stable}` : "Chưa phân chuồng"}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone">Chọn ngựa để xem thông tin chuồng.</p>
      )}
      <p className="border-t border-stone/15 pt-4 text-sm text-stone">Sự cố liên quan sức khỏe sẽ được báo cho HLV và bác sĩ thú y.</p>
    </div>
  );
}
