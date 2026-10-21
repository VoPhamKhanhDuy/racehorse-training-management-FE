import { daysSince, shortWeekdayName } from "../../utils/date";

// "Còn 6 ngày" / "Ngày mai" / "Hôm nay" / "Đã diễn ra"
function countdownText(daysLeft) {
  if (daysLeft < 0) return "Đã diễn ra";
  if (daysLeft === 0) return "Hôm nay";
  if (daysLeft === 1) return "Ngày mai";
  return `Còn ${daysLeft} ngày`;
}

// Tiêu đề 1 cột giải (nền sáng #f3ede0, 3 dòng): ngày lớn + "thg 10 · T6" | đếm ngược căn phải; tên giải (tối đa 2 dòng); địa điểm (xuống dòng, không cắt).
// Giải trong vòng 7 ngày: vạch cam 3px ở mép trên + đếm ngược cam đậm. Giải đã diễn ra: chữ mờ + dòng "Đã nhập N/M" (resultCount: { done, total }).
export default function RaceColumnHeader({ race, isFirst, resultCount }) {
  const daysLeft = -daysSince(race.Ngay);
  const isPast = daysLeft < 0;
  const isSoon = daysLeft >= 0 && daysLeft <= 7;
  const [, month, day] = race.Ngay.split("-");

  return (
    <th
      scope="col"
      className={`relative border-b-2 border-b-[#b9ab90] bg-[#f3ede0] px-3 py-2 text-left align-top font-normal text-[#2b2118] ${
        isFirst ? "" : "border-l border-l-[#d9cfba]"
      } ${isSoon ? "before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[#c2570c]" : ""}`}
    >
      <div className={isPast ? "opacity-70" : ""}>
        <p className="flex items-baseline justify-between gap-2">
          <span className="flex items-baseline gap-2">
            <span className="font-serif text-lg leading-none font-semibold tabular-nums">{day}</span>
            <span className="text-xs whitespace-nowrap text-[#6b6055]">
              thg {Number(month)} · {shortWeekdayName(race.Ngay)}
            </span>
          </span>
          <span className={`text-xs whitespace-nowrap ${isSoon ? "font-semibold text-[#c2570c]" : "text-[#6b6055]"}`}>
            {countdownText(daysLeft)}
          </span>
        </p>
        {/* Giữ chỗ đủ 2 dòng để các cột cao bằng nhau */}
        <p title={race.TenGiai} className="mt-1.5 line-clamp-2 min-h-[2lh] text-sm leading-snug font-semibold">
          {race.TenGiai}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-[#6b6055]">{race.DiaDiem}</p>
      </div>
      {isPast && resultCount?.total > 0 && (
        <p className="mt-1 text-xs text-[#6b6055] tabular-nums">
          Đã nhập {resultCount.done}/{resultCount.total}
        </p>
      )}
    </th>
  );
}
