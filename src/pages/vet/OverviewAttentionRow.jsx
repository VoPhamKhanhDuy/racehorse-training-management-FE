import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import HorseIcon from "../../components/HorseIcon";
import { formatDayMonth, formatDaysAgo, formatHorseAge } from "../../utils/date";

// Mẫu cột dùng chung cho Bảng theo dõi (hàng tiêu đề, dòng "Cần chú ý", dòng "Tình trạng tốt"): Ngựa | Tình trạng |
// Khám gần nhất | Lưu ý | chevron. Từ 900px mới chia cột; cột Ngựa và Lưu ý co giãn để vừa khung hẹp (~690px ở màn 1024px có sidebar).
export const BOARD_GRID =
  "min-[900px]:grid min-[900px]:grid-cols-[minmax(180px,240px)_120px_130px_minmax(160px,1fr)_20px] min-[900px]:items-center min-[900px]:gap-x-3";

// Vạch dọc 3px bên trái dòng + màu chữ tình trạng (chỉ "Đang điều trị" in đậm vừa)
const STATUS_STYLES = {
  "Đang điều trị": { text: "font-medium text-bark", bar: "before:bg-brass" },
  "Cần theo dõi": { text: "text-brass-deep", bar: "before:bg-sand" },
};

// 1 ngựa trong nhóm "Cần chú ý" (Đang điều trị / Cần theo dõi). Cả dòng là link sang sổ khám bệnh lọc ngựa này.
// latestRecord: lần khám gần nhất (có thể undefined); note: 1 lưu ý quan trọng nhất (chuỗi, có thể rỗng).
export default function OverviewAttentionRow({ horse, status, latestRecord, note }) {
  const styles = STATUS_STYLES[status] ?? { text: "text-ink", bar: "" };
  const facts = [horse.Giong, formatHorseAge(horse.NgaySinh)].filter(Boolean);

  return (
    <li>
      <Link
        to={`/vet/exams?horse=${horse.HorseID}`}
        className={`group relative flex min-h-[80px] flex-col gap-2 border-b border-stone/15 py-3 pr-2 pl-3 text-sm outline-none transition-colors before:absolute before:inset-y-2 before:left-0 before:w-[3px] hover:bg-track/50 focus-visible:bg-track/50 ${BOARD_GRID} ${styles.bar}`}
      >
        <span className="flex min-w-0 items-center gap-3 min-[900px]:pr-2">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-stone/10 text-stone">
            {horse.photo ? (
              <img
                src={horse.photo}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: horse.photoPosition ?? "center 30%" }}
              />
            ) : (
              <HorseIcon className="h-6 w-6" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-[19px] leading-tight font-semibold break-words text-ink">{horse.Ten}</span>
            <span className="block text-[13px] text-stone">{facts.join(" · ")}</span>
          </span>
        </span>

        {/* Dưới 900px: tình trạng · khám gần nhất trên 1 hàng, lưu ý xuống dưới */}
        <span aria-label="Tình trạng" className={`text-[15px] ${styles.text}`}>
          {status}
        </span>

        <span aria-label="Khám gần nhất" className="min-w-0">
          {latestRecord ? (
            <>
              <span className="text-[15px] text-ink tabular-nums">{formatDayMonth(latestRecord.Ngay)}</span>
              <span className="text-[13px] text-stone min-[900px]:block">
                <span className="min-[900px]:hidden"> · </span>
                {formatDaysAgo(latestRecord.Ngay)}
              </span>
            </>
          ) : (
            <span className="text-stone">Chưa khám</span>
          )}
        </span>

        <span aria-label="Lưu ý" title={note || undefined} className={`line-clamp-2 min-w-0 text-ink ${note ? "" : "hidden min-[900px]:block"}`}>
          {note}
        </span>

        <ChevronRight
          className="absolute top-1/2 right-2 hidden h-4 w-4 -translate-y-1/2 text-stone opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 min-[900px]:static min-[900px]:block min-[900px]:translate-y-0"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
