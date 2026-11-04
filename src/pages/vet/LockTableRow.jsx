import HorseAvatar from "../../components/HorseAvatar";
import { formatDate } from "../../utils/date";
import { lockDuration } from "../../utils/trainingLock";

// Mẫu cột danh sách lệnh khóa — dùng chung cho hàng tiêu đề và từng hàng.
// ≥900px: Ngựa | Lý do | Ngày đặt | Thời gian | Ngày gỡ | Bác sĩ đặt. Hẹp hơn: bỏ Ngày gỡ + Bác sĩ; Lý do xuống dưới tên ngựa,
// Ngày đặt và Thời gian gộp thành 1 cột 2 dòng bên phải.
export const LOCK_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 min-[900px]:grid-cols-[190px_minmax(0,1fr)_100px_100px_100px_150px] min-[900px]:gap-y-0";

// Vị trí ô khi hẹp: Ngựa (hàng 1) + Lý do (hàng 2) ở cột trái, Ngày đặt/Thời gian chiếm 2 hàng ở cột phải; ≥900px về đúng thứ tự cột
const LOCK_CELL = {
  reason: "col-start-1 row-start-2 min-[900px]:col-start-auto min-[900px]:row-start-auto",
  dates: "col-start-2 row-span-2 row-start-1 min-[900px]:col-start-auto min-[900px]:row-span-1 min-[900px]:row-start-auto",
};

// 1 lệnh khóa = 1 hàng gọn. Cả hàng bấm được để mở ngăn chi tiết; selected: vạch cam 2px bên trái + nền be nhạt.
export default function LockTableRow({ lock, horse, vetName, selected, onSelect }) {
  const active = !lock.NgayGo;

  return (
    <li className="border-b border-stone/15">
      <button
        type="button"
        onClick={() => onSelect(lock)}
        aria-label={`Lệnh khóa ${horse?.Ten ?? ""} từ ${formatDate(lock.NgayDat)}${active ? ", đang khóa" : `, đã gỡ ${formatDate(lock.NgayGo)}`}`}
        aria-current={selected ? "true" : undefined}
        className={`relative min-h-14 w-full cursor-pointer py-2 pr-2 pl-3 text-left text-sm outline-none transition-colors focus-visible:bg-track/50 ${LOCK_GRID} ${
          selected ? "bg-track/60 before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-brass" : "hover:bg-track/40"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <HorseAvatar horse={horse} size={28} />
          <span className="truncate font-serif text-base font-semibold text-ink">{horse?.Ten ?? `Ngựa #${lock.HorseID}`}</span>
        </span>
        <span className={`line-clamp-2 text-ink ${LOCK_CELL.reason}`} title={lock.LyDo}>
          {lock.LyDo}
        </span>
        {/* Hẹp: 2 dòng trong 1 cột; ≥900px: tách thành 2 cột (display: contents) */}
        <span className={`flex flex-col items-end min-[900px]:contents ${LOCK_CELL.dates}`}>
          <span className="text-ink tabular-nums">{formatDate(lock.NgayDat)}</span>
          <span className={active ? "font-medium text-brass-deep" : "text-stone"}>{lockDuration(lock)}</span>
        </span>
        <span className="hidden text-ink tabular-nums min-[900px]:block">{active ? "—" : formatDate(lock.NgayGo)}</span>
        <span className="hidden truncate text-right text-stone min-[900px]:block">BS. {vetName ?? "Không rõ"}</span>
      </button>
    </li>
  );
}
