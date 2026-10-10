import { MapPin } from "lucide-react";
import { daysSince, shortWeekdayName } from "../../utils/date";

// "Còn 6 ngày" / "Ngày mai" / "Hôm nay" / "Đã diễn ra"
function countdownText(daysLeft) {
  if (daysLeft < 0) return "Đã diễn ra";
  if (daysLeft === 0) return "Hôm nay";
  if (daysLeft === 1) return "Ngày mai";
  return `Còn ${daysLeft} ngày`;
}

// Tiêu đề 1 cột giải (3 dòng): ngày lớn + "thg 10 · T6" | đếm ngược căn phải; tên giải (tối đa 2 dòng); địa điểm (1 dòng).
// Giải trong vòng 7 ngày: vạch cam 3px ở mép trên. Giải đã diễn ra: chữ mờ.
export default function RaceColumnHeader({ race, isFirst }) {
  const daysLeft = -daysSince(race.Ngay);
  const isPast = daysLeft < 0;
  const isSoon = daysLeft >= 0 && daysLeft <= 7;
  const [, month, day] = race.Ngay.split("-");

  return (
    <th
      scope="col"
      className={`relative border-b border-stone/15 p-3 text-left align-top font-normal ${isFirst ? "" : "border-l border-l-stone/10"} ${
        isSoon ? "before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-brass" : ""
      }`}
    >
      <div className={isPast ? "opacity-55" : ""}>
        <p className="flex items-baseline gap-1.5">
          <span className="font-serif text-[28px] leading-none font-semibold text-bark tabular-nums">{day}</span>
          <span className="text-xs whitespace-nowrap text-stone">
            thg {Number(month)} · {shortWeekdayName(race.Ngay)}
          </span>
          <span className="ml-auto text-xs whitespace-nowrap text-stone">{countdownText(daysLeft)}</span>
        </p>
        {/* Giữ chỗ đủ 2 dòng để dòng địa điểm của các cột thẳng hàng */}
        <p title={race.TenGiai} className="mt-1.5 line-clamp-2 min-h-[2lh] font-serif text-base leading-snug font-semibold text-ink">
          {race.TenGiai}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-stone">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span title={race.DiaDiem} className="truncate">
            {race.DiaDiem}
          </span>
        </p>
      </div>
    </th>
  );
}
