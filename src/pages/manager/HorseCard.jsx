import { ChevronRight } from "lucide-react";
import HealthStatusBadge from "../../components/HealthStatusBadge";
import HorseIcon from "../../components/HorseIcon";
import { getHealthStyle } from "../../utils/healthStatusStyles";

// Thẻ 1 con ngựa trong lưới. Bấm cả thẻ để mở modal chi tiết (Sửa/Xóa nằm trong modal, không đặt trên thẻ).
export default function HorseCard({ horse, ownerName, healthStatus, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(horse)}
      aria-label={`Xem chi tiết ngựa ${horse.Ten}`}
      className="group w-full cursor-pointer overflow-hidden rounded-md border border-stone/15 bg-white text-left transition hover:-translate-y-0.5 hover:border-brass/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brass/50 focus-visible:outline-none"
    >
      {/* Ảnh thật nếu có, không thì icon ngựa trên nền pastel theo trạng thái sức khỏe */}
      <div className={`relative flex aspect-[16/7] items-center justify-center overflow-hidden sm:aspect-video ${getHealthStyle(healthStatus).tint}`}>
        {horse.photo ? (
          <img
            src={horse.photo}
            alt={`Ảnh ngựa ${horse.Ten}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-[center_25%] transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <HorseIcon className="h-12 w-12" strokeWidth={1.25} />
        )}
        <HealthStatusBadge status={healthStatus} className="absolute top-2.5 left-2.5" />
        {/* Gợi ý bấm được, nổi trên ảnh nên không chiếm chỗ dòng chữ: luôn hiện trên mobile (không có hover), từ sm chỉ hiện khi hover/focus */}
        <span className="absolute right-2.5 bottom-2.5 flex items-center rounded-full bg-white/90 py-0.5 pr-1.5 pl-2.5 text-xs font-medium text-brass-deep transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
          Xem chi tiết
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>

      <div className="px-3.5 py-2.5">
        <p className="truncate font-serif text-lg leading-snug font-semibold text-ink">{horse.Ten}</p>
        <p className="mt-0.5 truncate text-sm text-stone">
          {[horse.Giong, `${horse.Tuoi} tuổi`, `${horse.CanNang.toLocaleString("vi-VN")} kg`].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 truncate text-xs text-stone/70">Chủ sở hữu: {ownerName ?? "Chưa rõ"}</p>
      </div>
    </button>
  );
}
