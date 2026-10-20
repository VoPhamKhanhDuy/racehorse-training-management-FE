import HorseIcon from "../../components/HorseIcon";
import { TRAINING_PHASES } from "../../data/trainingPlanOptions";

// Cột trái: danh sách ngựa. Dòng đang chọn có nền be nhạt + vạch cam bên trái (giống mục đang chọn ở Sidebar).
// defaultSelection: ngựa chỉ được chọn mặc định (chưa bấm) → chỉ tô ở desktop, vì màn hẹp chưa mở chi tiết nào.
const SELECTED = "bg-brass/10 before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:bg-brass";
const SELECTED_DESKTOP_ONLY =
  "hover:bg-black/[0.03] lg:bg-brass/10 lg:before:absolute lg:before:inset-y-1.5 lg:before:left-0 lg:before:w-[3px] lg:before:bg-brass";

export default function HorsePlanList({ horses, plansByHorse, selectedId, defaultSelection = false, onSelect }) {
  return (
    <ul>
      {horses.map((horse) => {
        // Số giai đoạn đã lập (mỗi giai đoạn tối đa 1 giáo án nên đếm số giáo án là đủ)
        const plannedCount = plansByHorse[horse.HorseID]?.length ?? 0;
        const selected = horse.HorseID === selectedId;

        return (
          <li key={horse.HorseID} className="border-b border-stone/15 last:border-b-0">
            <button
              type="button"
              onClick={() => onSelect(horse.HorseID)}
              aria-current={selected ? "true" : undefined}
              className={`relative flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                !selected ? "hover:bg-black/[0.03]" : defaultSelection ? SELECTED_DESKTOP_ONLY : SELECTED
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone/10 text-stone">
                {horse.photo ? (
                  <img src={horse.photo} alt="" className="h-full w-full object-cover object-[center_25%]" />
                ) : (
                  <HorseIcon className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-serif text-base leading-snug font-semibold text-ink">{horse.Ten}</span>
                <span className="block truncate text-xs text-stone">
                  {plannedCount ? `Đã lập ${plannedCount}/${TRAINING_PHASES.length} giai đoạn` : "Chưa có giáo án"}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
