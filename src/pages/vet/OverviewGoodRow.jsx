import { Link } from "react-router-dom";
import HorseAvatar from "../../components/HorseAvatar";
import { BOARD_CELL, LastExamCell, StatusCell } from "./OverviewAttentionRow";
import { formatDayMonth } from "../../utils/date";

// 1 ngựa trong nhóm "Tình trạng tốt": cùng mẫu cột với nhóm "Cần chú ý" (Ngựa | Tình trạng | Khám gần nhất | Vắc-xin).
// vaccine: mũi cần nhắc (có thể undefined). status: ngựa chưa có bản ghi sức khỏe cũng nằm ở nhóm này, hiện "Chưa cập nhật".
// Cả hàng bấm được: liên kết ở tên ngựa phủ kín hàng, dẫn sang sổ khám bệnh lọc ngựa này.
export default function OverviewGoodRow({ horse, status, latestRecord, vaccine }) {
  return (
    <tr className="group relative transition-colors hover:bg-[#f0efec]">
      <td className={`${BOARD_CELL} border-l-[3px] border-l-transparent`}>
        <span className="flex min-w-0 items-center gap-3">
          <HorseAvatar horse={horse} size={40} square />
          <Link
            to={`/vet/exams?horse=${horse.HorseID}`}
            className="font-serif text-base font-semibold text-[#2b2118] outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-[#c2570c]"
          >
            {horse.Ten}
          </Link>
        </span>
      </td>
      <StatusCell status={status} />
      <LastExamCell latestRecord={latestRecord} />
      <td className={`${BOARD_CELL} w-[220px] min-w-[220px] text-sm text-[#2b2118]`} aria-label="Lưu ý">
        {vaccine ? `Vắc-xin ${vaccine.Loai} ${formatDayMonth(vaccine.NgayHen)}` : <span className="text-[#b9ab90]">—</span>}
      </td>
    </tr>
  );
}
