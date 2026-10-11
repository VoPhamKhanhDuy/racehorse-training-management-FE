import HorseAvatar from "../../components/HorseAvatar";

// Mẫu cột của phiếu việc. ≥900px: Giờ | Ngựa (+ chuồng) | Loại việc | Hành động. Hẹp hơn: bỏ cột Giờ — giờ xuống
// thành dòng nhỏ dưới tên việc.
export const TASK_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 min-[900px]:grid-cols-[104px_250px_minmax(0,1fr)_auto]";

// 1 việc trong phiếu (~48px). Việc đã xong: mờ nhưng giữ đúng vị trí giờ, chữ "Đã xong" (không icon).
// - timeLabel: chữ trong cột Giờ (≥900px). "" = để trống giữ căn cột (việc cùng giờ với hàng trên trong ca).
//   Việc tồn: "dd/MM · HH:mm". mobileTime: giờ hiện dưới tên việc ở màn hẹp (luôn hiện, vì không có cột Giờ).
// - highlight: giờ chữ cam đậm (việc tồn, hoặc trễ). late: chưa xong quá giờ chuẩn → thêm chữ nhỏ "Trễ" (kể cả khi
//   timeLabel trống, để hàng trễ không mất dấu).
// - gapBefore: hàng đầu của 1 giờ mới → cách hàng trên thêm 8px để thấy nhịp thời gian.
export default function CareTaskRow({
  task,
  timeLabel,
  mobileTime,
  highlight = false,
  late = false,
  gapBefore = false,
  horse,
  horseName,
  stable,
  saving,
  onConfirm,
}) {
  const done = task.TrangThai;
  const timeClass = highlight || late ? "font-medium text-brass-deep" : done ? "text-stone/70" : "text-ink";

  return (
    <li className={`min-h-12 border-b border-stone/15 py-1.5 pr-1 text-sm ${TASK_GRID} ${gapBefore ? "mt-2" : ""} ${done ? "opacity-60" : ""}`}>
      <span className={`hidden whitespace-nowrap tabular-nums min-[900px]:block ${timeClass}`}>
        {timeLabel}
        {late && <span className={`text-xs font-medium text-brass-deep ${timeLabel ? "ml-1.5" : ""}`}>Trễ</span>}
      </span>

      <span className="flex min-w-0 items-center gap-2 min-[900px]:col-start-2">
        <HorseAvatar horse={horse} size={28} />
        <span className="min-w-0">
          <span className="font-serif text-base font-semibold text-ink">{horseName}</span>
          {stable && <span className="ml-2 text-xs whitespace-nowrap text-stone">Chuồng {stable}</span>}
          {/* Hẹp: loại việc + giờ ngay dưới tên ngựa */}
          <span className="mt-0.5 block min-[900px]:hidden">
            <span className="text-ink">{task.LoaiViec}</span>
            <span className={`ml-2 text-xs tabular-nums ${timeClass}`}>
              {mobileTime}
              {late && " · Trễ"}
            </span>
          </span>
        </span>
      </span>

      <span className="hidden min-w-0 text-ink min-[900px]:block">{task.LoaiViec}</span>

      {done ? (
        <span className="px-2.5 py-1 text-stone">Đã xong</span>
      ) : (
        // Link chữ cam: không nền/viền; viền nhạt chỉ hiện khi rê chuột / focus (viền trong suốt giữ chỗ)
        <button
          type="button"
          onClick={() => onConfirm(task)}
          disabled={saving}
          aria-label={`Xác nhận xong ${task.LoaiViec} cho ${horseName}`}
          className="cursor-pointer rounded-sm border border-transparent px-2.5 py-1 font-medium whitespace-nowrap text-brass-deep transition-colors hover:border-brass/40 focus-visible:border-brass/40 disabled:cursor-wait disabled:opacity-60"
        >
          Xác nhận xong
        </button>
      )}
    </li>
  );
}
