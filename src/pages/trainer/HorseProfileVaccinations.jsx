import HorseProfileSection from "./HorseProfileSection";
import { formatDate } from "../../utils/date";

// Màu chữ theo VACCINATIONSCHEDULE.TrangThai — chữ thường, không nền/không chấm
const STATUS_TEXT = {
  "Quá hạn": "text-brass-deep",
  "Chờ tiêm": "text-ink/75",
  "Đã tiêm": "text-bark",
};

// Mục "Vắc-xin" trong hồ sơ ngựa (vaccinations đã sắp NgayHen mới → cũ). Cột phụ hẹp nên mỗi mục 2 dòng.
export default function HorseProfileVaccinations({ vaccinations, className }) {
  return (
    <HorseProfileSection title="Vắc-xin" className={className}>
      {vaccinations.length === 0 ? (
        <p className="text-sm text-stone">Chưa có lịch tiêm phòng nào.</p>
      ) : (
        <ul>
          {vaccinations.map((v) => (
            <li key={v.ScheduleID} className="border-b border-stone/15 py-2.5 text-sm last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-ink">{v.Loai}</span>
                <span className={`shrink-0 ${STATUS_TEXT[v.TrangThai] ?? "text-stone"}`}>{v.TrangThai}</span>
              </div>
              <p className="text-xs text-stone tabular-nums">Ngày hẹn {formatDate(v.NgayHen)}</p>
            </li>
          ))}
        </ul>
      )}
    </HorseProfileSection>
  );
}
