import { Check } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";
import { formatDayMonth } from "../../utils/date";

// Mẫu cột của phiếu việc. ≥768px: Giờ 70px | Ngựa (+ chuồng) | Công việc (phần còn lại) | Hành động 150px.
// Hẹp hơn: các cột xếp dọc — giờ xuống dòng nhỏ dưới tên việc, nút xuống dòng riêng rộng 100%.
export const TASK_GRID = "grid grid-cols-1 gap-y-2 md:grid-cols-[70px_240px_minmax(0,1fr)_150px] md:items-center md:gap-x-4";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

// 1 việc trong phiếu (≥60px). Việc đã xong: chữ vẫn rõ, hiện tick + "Đã xong" ở cột hành động, tên việc gạch ngang nhẹ.
// - timeLabel: chữ trong cột Giờ (≥768px). "" = để trống giữ căn cột (việc cùng giờ với hàng trên trong ca).
//   Việc tồn: "dd/MM · HH:mm" → cột Giờ chỉ hiện HH:mm, ngày hiện thành nhãn "Tồn từ dd/MM" cạnh tên việc.
//   mobileTime: giờ hiện dưới tên việc ở màn hẹp (luôn hiện, vì không có cột Giờ).
// - highlight: việc tồn. late: chưa xong quá giờ chuẩn → thêm chữ nhỏ "Trễ" (kể cả khi timeLabel trống).
export default function CareTaskRow({ task, timeLabel, mobileTime, highlight = false, late = false, horse, horseName, stable, saving, onConfirm }) {
  const done = task.TrangThai;
  const columnTime = highlight ? (timeLabel.split(" · ")[1] ?? timeLabel) : timeLabel;
  const mobileHour = highlight ? (mobileTime.split(" · ")[1] ?? mobileTime) : mobileTime;
  const timeClass = late ? "text-[#c2570c]" : "text-[#2b2118]";
  const taskClass = done ? "text-[#6b6055] line-through" : "text-[#2b2118]";
  const backlogTag = highlight && !done && <span className="ml-2 text-[13px] font-semibold text-[#c0262d]">Tồn từ {formatDayMonth(task.Ngay)}</span>;

  return (
    <li className={`min-h-[60px] border-b border-[#ece5d6] px-5 py-3 transition-colors last:border-b-0 hover:bg-[#f0efec] ${TASK_GRID}`}>
      <span className={`hidden text-[15px] font-semibold whitespace-nowrap tabular-nums md:block ${timeClass}`}>
        {columnTime}
        {late && <span className={`text-[13px] font-semibold text-[#c2570c] ${columnTime ? "ml-1.5" : ""}`}>Trễ</span>}
      </span>

      <span className="flex min-w-0 items-center gap-3 md:col-start-2">
        <HorseAvatar horse={horse} size={36} square />
        <span className="min-w-0">
          <span className="block truncate font-serif text-base font-semibold text-[#4a3f33]">{horseName}</span>
          {stable && <span className="block text-[13px] text-[#6b6055]">Chuồng {stable}</span>}
        </span>
      </span>

      {/* Hẹp: tên việc + giờ nằm dưới ngựa */}
      <span className="min-w-0 text-[15px] md:hidden">
        <span className={taskClass}>{task.LoaiViec}</span>
        {backlogTag}
        <span className={`ml-2 text-[13px] tabular-nums ${timeClass}`}>
          {mobileHour}
          {late && " · Trễ"}
        </span>
      </span>
      <span className="hidden min-w-0 text-[15px] md:block">
        <span className={taskClass}>{task.LoaiViec}</span>
        {backlogTag}
      </span>

      {done ? (
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#4d6b2a] md:justify-end">
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          Đã xong
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onConfirm(task)}
          disabled={saving}
          aria-label={`Hoàn thành ${task.LoaiViec} cho ${horseName}`}
          className={`h-9 w-full cursor-pointer rounded-[4px] border border-[#c2570c] bg-white px-3 text-sm font-semibold whitespace-nowrap text-[#c2570c] transition-colors hover:bg-[#fbf3e6] disabled:cursor-wait disabled:opacity-60 md:w-auto md:justify-self-end ${FOCUS_RING}`}
        >
          Hoàn thành
        </button>
      )}
    </li>
  );
}
