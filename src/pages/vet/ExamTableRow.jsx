import HorseAvatar from "../../components/HorseAvatar";
import { NO_INJURY } from "../../data/medicalRecordOptions";
import { formatDayMonth } from "../../utils/date";

// Mẫu cột của sổ bệnh án — dùng chung cho hàng tiêu đề và từng hàng. Dưới 900px bỏ cột Vị trí và Bác sĩ.
export const EXAM_GRID =
  "grid grid-cols-[52px_minmax(120px,170px)_minmax(0,1fr)] items-center gap-x-4 min-[900px]:grid-cols-[52px_190px_minmax(0,1fr)_minmax(140px,200px)_150px]";

// 1 lần khám = 1 hàng gọn (~56px): Ngày | Ngựa | Chẩn đoán (1 dòng) | Vị trí chấn thương | Bác sĩ. Phác đồ không hiện ở đây.
// Cả hàng bấm được để mở ngăn chi tiết; selected: hàng đang mở (vạch cam 2px bên trái + nền be nhạt).
export default function ExamTableRow({ record, horse, vetName, selected, onSelect }) {
  const injury = record.ViTriChanThuong && record.ViTriChanThuong !== NO_INJURY ? record.ViTriChanThuong : "—";

  return (
    <li className="border-b border-stone/15">
      <button
        type="button"
        onClick={() => onSelect(record)}
        aria-label={`Lần khám ${horse?.Ten ?? ""} ngày ${formatDayMonth(record.Ngay)}: ${record.ChanDoan}`}
        aria-current={selected ? "true" : undefined}
        className={`relative min-h-14 w-full cursor-pointer py-2 pr-2 pl-3 text-left text-sm outline-none transition-colors focus-visible:bg-track/50 ${EXAM_GRID} ${
          selected ? "bg-track/60 before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-brass" : "hover:bg-track/40"
        }`}
      >
        <span className="text-ink tabular-nums">{formatDayMonth(record.Ngay)}</span>
        <span className="flex min-w-0 items-center gap-2">
          <HorseAvatar horse={horse} size={28} />
          <span className="truncate font-serif text-base font-semibold text-ink">{horse?.Ten ?? `Ngựa #${record.HorseID}`}</span>
        </span>
        <span className="truncate font-medium text-ink" title={record.ChanDoan}>
          {record.ChanDoan}
        </span>
        <span className="hidden truncate text-ink min-[900px]:block" title={injury === "—" ? undefined : injury}>
          {injury}
        </span>
        <span className="hidden truncate text-right text-stone min-[900px]:block">BS. {vetName ?? "Không rõ"}</span>
      </button>
    </li>
  );
}
