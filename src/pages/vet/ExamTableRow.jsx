import HorseAvatar from "../../components/HorseAvatar";
import { examOutcome } from "../../utils/examOutcome";
import { formatDate, formatDayMonth } from "../../utils/date";

// Ô bảng: kẻ ô 1px #E3E3E3 (ngang + dọc, ô cuối không kẻ dọc), padding 12px 16px, căn giữa dọc, nội dung dài cắt 1 dòng
const CELL = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// 1 lần khám = 1 hàng: STT | Ngày khám | Ngựa | Chẩn đoán | Kết quả khám | Vị trí chấn thương | Bác sĩ khám | Thao tác ("Xem" → modal chi tiết).
// Kết quả bình thường: chữ thường; có chấn thương / bất thường: chữ đỏ đậm (không chấm). Phác đồ không hiện ở bảng.
export default function ExamTableRow({ index, record, horse, vetName, onSelect }) {
  const { result, location, abnormal } = examOutcome(record);
  const name = horse?.Ten ?? `Ngựa #${record.HorseID}`;
  const empty = <span className="text-[#B5B5B5]">—</span>;

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
      aria-label={`Lần khám ${name} ngày ${formatDayMonth(record.Ngay)}: ${record.ChanDoan}`}
      className="h-14 cursor-pointer bg-white transition-colors hover:bg-[#FAFAFA] focus-visible:bg-[#FAFAFA] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c]"
    >
      <td className={`${CELL} text-center text-[#6b6b6b] tabular-nums`}>{index}</td>
      <td className={`${CELL} whitespace-nowrap tabular-nums`}>{formatDate(record.Ngay)}</td>
      <td className={CELL}>
        <span className="flex min-w-0 items-center gap-2.5">
          <HorseAvatar horse={horse} size={32} square />
          <span className="truncate font-semibold" title={name}>
            {name}
          </span>
        </span>
      </td>
      <td className={CELL}>
        <span className="block truncate" title={record.ChanDoan}>
          {record.ChanDoan || empty}
        </span>
      </td>
      <td className={CELL}>
        {result ? (
          <span className={`block truncate ${abnormal ? "font-semibold text-[#c0262d]" : ""}`} title={result}>
            {result}
          </span>
        ) : (
          empty
        )}
      </td>
      <td className={CELL}>
        {location ? (
          <span className="block truncate" title={location}>
            {location}
          </span>
        ) : (
          empty
        )}
      </td>
      <td className={CELL}>
        <span className="block truncate" title={vetName ?? undefined}>
          {vetName ?? empty}
        </span>
      </td>
      <td className={CELL}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(record);
          }}
          className="cursor-pointer font-semibold whitespace-nowrap text-[#c2570c] hover:underline"
        >
          Xem
        </button>
      </td>
    </tr>
  );
}
