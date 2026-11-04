import { useState } from "react";
import { formatDate } from "../../utils/date";
import { NO_RANK, PODIUM_MAX, formatRank } from "../../utils/raceResult";

const VISIBLE_COUNT = 5;

// Khối "Thành tích thi đấu" trong hồ sơ ngựa (chỉ xem) — tính từ RACEREGISTRATION (ThuHang) nối RACE, không lưu vào HORSE.
// achievements: kết quả getHorseAchievements (utils/horseAchievements). Mới nhất trước; tối đa 5 dòng, "Xem tất cả" mở rộng tại chỗ.
export default function HorseRaceRecord({ achievements }) {
  const [showAll, setShowAll] = useState(false);

  const { entries: sorted, participated, wins, podiums } = achievements;
  const summary = [
    `Đã tham gia ${participated} giải`,
    wins > 0 && `${wins} lần hạng nhất`,
    podiums > 0 && `${podiums} lần vào top 3`,
  ]
    .filter(Boolean)
    .join(" · ");
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE_COUNT);

  // Bên phải mỗi dòng: kết quả, hoặc trạng thái nếu chưa có
  const renderResult = ({ registration, state }) => {
    if (state === "upcoming") return <span className="text-stone">Sắp diễn ra</span>;
    if (state === "pending") return <span className="text-stone">Chưa có kết quả</span>;
    if (state === "unranked") return <span className="text-stone">{formatRank(NO_RANK)}</span>;
    return (
      <span className={registration.ThuHang <= PODIUM_MAX ? "font-semibold text-bark" : "text-ink"}>
        {formatRank(registration.ThuHang)}
      </span>
    );
  };

  return (
    <section aria-label="Thành tích thi đấu" className="mt-6 border-t border-stone/15 pt-5">
      <h3 className="text-[11px] font-medium tracking-wide text-stone uppercase">Thành tích thi đấu</h3>
      {sorted.length === 0 ? (
        <p className="mt-2 text-sm text-stone">Chưa tham gia giải nào</p>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-ink">{summary}</p>
          <ul className="mt-2">
            {visible.map((entry) => (
              // 2 dòng: tên giải (xuống dòng nếu dài) | kết quả căn trên bên phải; dòng dưới ngày · địa điểm đầy đủ
              <li key={entry.race.RaceID} className="border-b border-stone/15 py-2.5 text-sm last:border-b-0">
                <div className="flex items-start justify-between gap-4">
                  <span className="min-w-0 font-medium break-words text-ink">{entry.race.TenGiai}</span>
                  <span className="shrink-0 whitespace-nowrap">{renderResult(entry)}</span>
                </div>
                <p className="mt-0.5 text-xs break-words text-stone">
                  <span className="tabular-nums">{formatDate(entry.race.Ngay)}</span> · {entry.race.DiaDiem}
                </p>
              </li>
            ))}
          </ul>
          {sorted.length > VISIBLE_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="mt-2 cursor-pointer text-sm font-medium text-brass-deep underline-offset-2 hover:underline"
            >
              {showAll ? "Thu gọn" : `Xem tất cả (${sorted.length})`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
