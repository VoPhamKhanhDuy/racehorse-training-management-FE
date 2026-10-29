import HorseAvatar from "../../components/HorseAvatar";
import { NO_INJURY } from "../../data/medicalRecordOptions";
import { formatDate, formatDayMonth } from "../../utils/date";

const CELL = "border-b border-[#d9cfba] px-4 py-3";

// 1 lần khám = 1 hàng bảng: Ngựa | Chẩn đoán (tối đa 2 dòng) | Vị trí chấn thương | Ngày khám. Phác đồ không hiện ở đây.
// Cả hàng bấm được (Enter/Space) để mở ngăn chi tiết; selected: hàng đang mở (nền xám nhạt).
// Có chấn thương: vạch trái 3px đỏ (không tô nền).
export default function ExamTableRow({ record, horse, selected, onSelect }) {
  const hasInjury = Boolean(record.ViTriChanThuong) && record.ViTriChanThuong !== NO_INJURY;

  return (
    <tr
      tabIndex={0}
      onClick={() => onSelect(record)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(record);
        }
      }}
      aria-label={`Lần khám ${horse?.Ten ?? ""} ngày ${formatDayMonth(record.Ngay)}: ${record.ChanDoan}`}
      aria-current={selected ? "true" : undefined}
      className={`cursor-pointer text-[#2b2118] transition-colors hover:bg-[#f0efec] focus-visible:bg-[#f0efec] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c] ${
        selected ? "bg-[#f0efec]" : ""
      }`}
    >
      <td className={`${CELL} w-[220px] min-w-[220px] border-l-[3px] whitespace-nowrap ${hasInjury ? "border-l-[#c0262d]" : "border-l-transparent"}`}>
        <span className="flex items-center gap-3">
          <HorseAvatar horse={horse} size={36} square />
          <span className="font-serif text-base font-semibold">{horse?.Ten ?? `Ngựa #${record.HorseID}`}</span>
        </span>
      </td>
      <td className={`${CELL} text-[15px]`}>
        <span className="line-clamp-2" title={record.ChanDoan}>
          {record.ChanDoan}
        </span>
      </td>
      <td className={`${CELL} w-[240px] min-w-[240px] text-sm`}>
        {hasInjury ? (
          <span className="line-clamp-2 font-semibold text-[#c0262d]" title={record.ViTriChanThuong}>
            {record.ViTriChanThuong}
          </span>
        ) : (
          <span className="text-[#b9ab90]">—</span>
        )}
      </td>
      <td className={`${CELL} w-[130px] min-w-[130px] max-w-[130px] text-right text-sm whitespace-nowrap text-[#4a3f33] tabular-nums`}>
        {formatDate(record.Ngay)}
      </td>
    </tr>
  );
}
