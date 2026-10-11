import HorseProfileSection from "./HorseProfileSection";
import { formatDate } from "../../utils/date";
import { getVaccineState } from "../../utils/healthAlerts";

// Màu chữ theo trạng thái hiển thị (getVaccineState: "Quá hạn" tính từ "Chờ tiêm" + NgayHen đã qua) — chữ thường, không nền/không chấm
const STATUS_TEXT = {
  "Quá hạn": "text-brass-deep",
  "Sắp tới": "text-ink/75",
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
          {vaccinations.map((v) => {
            const state = getVaccineState(v);
            return (
              <li key={v.ScheduleID} className="border-b border-stone/15 py-2.5 text-sm last:border-b-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-ink">{v.Loai}</span>
                  <span className={`shrink-0 ${STATUS_TEXT[state] ?? "text-stone"}`}>{state}</span>
                </div>
                <p className="text-xs text-stone tabular-nums">Ngày hẹn {formatDate(v.NgayHen)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </HorseProfileSection>
  );
}
