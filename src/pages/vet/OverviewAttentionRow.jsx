import { Link } from "react-router-dom";
import { Check, Eye, TriangleAlert } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";
import { formatDate, formatDaysAgo, formatHorseAge } from "../../utils/date";
import { getHealthLabel, getHealthStyle } from "../../utils/healthStatusStyles";

export const BOARD_CELL = "border-b border-[#d9cfba] px-4 py-3 align-middle";

// Icon theo tình trạng: tốt → tick; đang điều trị → cảnh báo; cần theo dõi → mắt
const STATUS_ICON = { "Tốt": Check, "Đủ điều kiện": Check, "Đang điều trị": TriangleAlert, "Cần theo dõi": Eye };
// Vạch dọc 3px bên trái hàng "Cần chú ý" (chỉ vạch, không tô nền)
const STATUS_BAR = { "Đang điều trị": "border-l-[#c0262d]", "Cần theo dõi": "border-l-[#c2570c]" };

// Ô Tình trạng (icon + chữ màu) và ô Khám gần nhất — dùng chung cho nhóm "Cần chú ý" và "Tình trạng tốt"
export function StatusCell({ status }) {
  const Icon = STATUS_ICON[status];
  return (
    <td className={`${BOARD_CELL} text-sm font-semibold whitespace-nowrap`} aria-label="Tình trạng">
      <span className={`flex items-center gap-1.5 ${getHealthStyle(status).text}`}>
        {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
        {getHealthLabel(status)}
      </span>
    </td>
  );
}

export function LastExamCell({ latestRecord }) {
  return (
    <td className={`${BOARD_CELL} whitespace-nowrap`} aria-label="Khám gần nhất">
      {latestRecord ? (
        <>
          <span className="block text-sm text-[#2b2118] tabular-nums">{formatDate(latestRecord.Ngay)}</span>
          <span className="block text-[13px] text-[#6b6055]">{formatDaysAgo(latestRecord.Ngay)}</span>
        </>
      ) : (
        <span className="text-sm text-[#6b6055]">Chưa khám</span>
      )}
    </td>
  );
}

// 1 ngựa trong nhóm "Cần chú ý" (Đang điều trị / Cần theo dõi). Cả hàng bấm được: liên kết ở tên ngựa phủ kín hàng,
// dẫn sang sổ khám bệnh lọc ngựa này. latestRecord: lần khám gần nhất (có thể undefined); note: 1 lưu ý quan trọng nhất (có thể rỗng).
export default function OverviewAttentionRow({ horse, status, latestRecord, note }) {
  const facts = [horse.Giong, formatHorseAge(horse.NgaySinh)].filter(Boolean);

  return (
    <tr className="group relative transition-colors hover:bg-[#f0efec]">
      <td className={`${BOARD_CELL} border-l-[3px] ${STATUS_BAR[status] ?? "border-l-transparent"}`}>
        <span className="flex min-w-0 items-center gap-3">
          <HorseAvatar horse={horse} size={40} square />
          <span className="min-w-0">
            <Link
              to={`/vet/exams?horse=${horse.HorseID}`}
              className="block font-serif text-base leading-tight font-semibold break-words text-[#2b2118] outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-[#c2570c]"
            >
              {horse.Ten}
            </Link>
            <span className="block text-[13px] text-[#6b6055]">{facts.join(" · ")}</span>
          </span>
        </span>
      </td>
      <StatusCell status={status} />
      <LastExamCell latestRecord={latestRecord} />
      <td className={`${BOARD_CELL} w-[220px] min-w-[220px] text-sm text-[#2b2118]`} aria-label="Lưu ý">
        {note ? (
          <span className="line-clamp-2" title={note}>
            {note}
          </span>
        ) : (
          <span className="text-[#b9ab90]">—</span>
        )}
      </td>
    </tr>
  );
}
