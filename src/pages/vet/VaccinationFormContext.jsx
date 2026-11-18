import HorseAvatar from "../../components/HorseAvatar";
import { formatDate, formatHorseAge } from "../../utils/date";
import { genderLabel } from "../../utils/horseGender";
import { getVaccineState } from "../../utils/healthAlerts";

const RECENT_COUNT = 5;
const STATE_TEXT = { "Quá hạn": "text-brass-deep", "Sắp tới": "text-bark", "Chờ tiêm": "text-stone", "Đã tiêm": "text-moss" };

// Thẻ ngữ cảnh bên phải form lịch tiêm: thông tin ngựa + các lịch gần nhất ("Cúm ngựa · 17/10/2026 · Chờ tiêm")
// để bác sĩ đối chiếu, tránh nhập trùng. items: lịch của ngựa đã chọn; editingId: lịch đang sửa (đánh dấu).
export default function VaccinationFormContext({ horse, items, editingId }) {
  if (!horse) {
    return <p className="py-6 text-center text-sm text-stone">Chọn ngựa để xem các lịch tiêm gần nhất.</p>;
  }

  const facts = [horse.Giong, formatHorseAge(horse.NgaySinh), genderLabel(horse.GioiTinh)].filter(Boolean);
  // Gần nhất = NgayHen mới nhất trước
  const recent = [...items].sort((a, b) => b.NgayHen.localeCompare(a.NgayHen)).slice(0, RECENT_COUNT);

  return (
    <div className="space-y-5">
      <div className="flex min-w-0 items-center gap-4">
        <HorseAvatar horse={horse} size={56} />
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-semibold text-ink">{horse.Ten}</h2>
          <p className="text-sm text-stone">{facts.join(" · ")}</p>
        </div>
      </div>

      <section aria-label="Lịch tiêm gần nhất" className="border-t border-stone/15 pt-4">
        <h3 className="font-serif text-base font-semibold text-ink">Lịch tiêm gần nhất</h3>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-stone">Ngựa này chưa có lịch tiêm nào.</p>
        ) : (
          <ul className="mt-1">
            {recent.map((item) => {
              const state = getVaccineState(item);
              return (
                <li key={item.ScheduleID} className="border-b border-stone/15 py-2 text-sm last:border-b-0">
                  <span className="text-ink">{item.Loai}</span>
                  <span className="text-stone tabular-nums"> · {formatDate(item.NgayHen)} · </span>
                  <span className={STATE_TEXT[state]}>{state}</span>
                  {item.ScheduleID === editingId && <span className="ml-1.5 text-xs text-brass-deep">(đang sửa)</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
