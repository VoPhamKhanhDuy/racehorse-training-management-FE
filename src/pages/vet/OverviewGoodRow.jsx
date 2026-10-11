import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";
import { BOARD_GRID } from "./OverviewAttentionRow";
import { formatDayMonth } from "../../utils/date";

// 1 ngựa trong nhóm "Tình trạng tốt": dòng mỏng ảnh tròn 32px + tên | "Tốt" | "Khám gần nhất dd/MM" | (vắc-xin sắp đến hạn/quá hạn).
// Cùng mẫu cột với nhóm "Cần chú ý" để chữ "Tốt" thẳng cột Tình trạng. vaccine: mũi cần nhắc (có thể undefined).
// status: ngựa chưa có bản ghi sức khỏe cũng nằm ở nhóm này, hiện "Chưa cập nhật".
export default function OverviewGoodRow({ horse, status, latestRecord, vaccine }) {
  return (
    <li>
      <Link
        to={`/vet/exams?horse=${horse.HorseID}`}
        className={`group flex min-h-[52px] flex-wrap items-center gap-x-3 gap-y-1 border-b border-stone/15 py-2 pr-2 pl-3 text-sm outline-none transition-colors hover:bg-track/50 focus-visible:bg-track/50 ${BOARD_GRID}`}
      >
        <span className="flex min-w-0 flex-1 basis-full items-center gap-3 min-[900px]:basis-auto">
          <HorseAvatar horse={horse} size={32} />
          <span className="font-serif text-base font-semibold text-ink">{horse.Ten}</span>
        </span>
        <span aria-label="Tình trạng" className={`text-[15px] ${status ? "text-bark" : "text-stone"}`}>
          {status ?? "Chưa cập nhật"}
        </span>
        {/* Giữ 1 dòng: hơi tràn sang khoảng cách cột kế bên (cột Lưu ý căn phải nên không đè chữ) */}
        <span aria-label="Khám gần nhất" className="whitespace-nowrap text-stone tabular-nums">
          {latestRecord ? `Khám gần nhất ${formatDayMonth(latestRecord.Ngay)}` : "Chưa khám"}
        </span>
        <span aria-label="Lưu ý" className="text-xs text-stone min-[900px]:text-right">
          {vaccine && `Vắc-xin ${vaccine.Loai} ${formatDayMonth(vaccine.NgayHen)}`}
        </span>
        <ChevronRight
          className="hidden h-4 w-4 text-stone opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 min-[900px]:block"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
