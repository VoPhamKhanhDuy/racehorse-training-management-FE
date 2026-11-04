import { Check, Plus } from "lucide-react";
import { formatDayMonth } from "../../utils/date";
import { LOCK_CONFLICT_RACE } from "../../utils/trainingLock";
import { NO_RANK, PODIUM_MAX, formatRank, hasResult } from "../../utils/raceResult";

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c2570c]";

// Ô giao ngựa × giải:
// - đã đăng ký: nền trắng, tick + chữ "Đã đăng ký" olive (ngựa khóa tập: đỏ) + ngày; rê chuột / focus: nền xám mờ + "Bấm để hủy" đỏ; bấm để hủy.
//   Giải đã diễn ra: hiện kết quả — "Hạng N" (1–3 chữ đậm) / "Không xếp hạng" (muted) / link cam "Nhập kết quả";
//   bấm ô để mở popover nhập/sửa thứ hạng.
//   Ngựa bị chặn mà vẫn đang đăng ký: chữ nâu lý do bên dưới, vẫn cho hủy; ngựa đang bị khóa (locked):
//   chữ đỏ "Cần rút đăng ký" để HLV tự rút.
// - chưa đăng ký, đủ điều kiện: dấu "+" SVG luôn hiện, rê chuột đổi cam + nền xám mờ; bấm để đăng ký.
// - bị chặn (khóa tập / đang điều trị): "—" nhạt, không bấm được. Giải đã diễn ra: để trống.
// rowHighlighted: hàng đang rê chuột (nền xám mờ).
export default function RaceRegistrationCell({
  horse,
  race,
  registration,
  blockReason,
  locked,
  isPast,
  isFirst,
  rowHighlighted,
  saving,
  onHover,
  onLeave,
  onRegister,
  onCancel,
  onOpenResult,
}) {
  let content;
  if (registration) {
    // Giải đã diễn ra: ô hiện kết quả; bấm ô để mở popover nhập/sửa thứ hạng (onOpenResult nhận DOMRect của ô)
    content = isPast ? (
      <button
        key="result"
        type="button"
        onClick={(e) => onOpenResult(e.currentTarget.closest("td").getBoundingClientRect())}
        aria-label={`${hasResult(registration) ? `Sửa kết quả: ${formatRank(registration.ThuHang)}` : "Nhập kết quả"} – ${horse.Ten}, ${race.TenGiai}`}
        className={`flex min-h-[40px] w-full cursor-pointer items-center rounded-[2px] px-2 text-left text-sm ${FOCUS}`}
      >
        {!hasResult(registration) ? (
          <span className="font-semibold text-[#c2570c] underline-offset-2 group-hover:underline">Nhập kết quả</span>
        ) : registration.ThuHang === NO_RANK ? (
          <span className="text-[#6b6055]">{formatRank(NO_RANK)}</span>
        ) : (
          <span className={`font-semibold ${registration.ThuHang <= PODIUM_MAX ? "text-[#8a3f08]" : "text-[#2b2118]"}`}>
            {formatRank(registration.ThuHang)}
          </span>
        )}
      </button>
    ) : (
      <div className="flex flex-col gap-0.5">
        <button
          key="cancel"
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label={`Hủy đăng ký ${horse.Ten} khỏi ${race.TenGiai}`}
          title="Bấm để hủy đăng ký"
          className={`block min-h-[40px] w-full flex cursor-pointer flex-col justify-center rounded-[2px] px-2.5 py-1 text-left transition-colors hover:bg-[#f0efec] focus-visible:bg-[#f0efec] disabled:cursor-wait disabled:opacity-60 ${FOCUS}`}
        >
          <span className={`flex items-center gap-1 text-sm font-semibold ${locked ? "text-[#c0262d]" : "text-[#4d6b2a]"}`}>
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Đã đăng ký
          </span>
          <span className="block text-xs text-[#6b6055] tabular-nums group-focus-within:hidden group-hover:hidden">
            {formatDayMonth(registration.NgayDangKy)}
          </span>
          <span className="hidden text-xs text-[#b3473f] group-focus-within:block group-hover:block">Bấm để hủy</span>
        </button>
        {/* Ngựa đang bị khóa mà vẫn đăng ký giải sắp tới: nhắc HLV tự rút (hệ thống không tự hủy) */}
        {locked ? (
          <span title={LOCK_CONFLICT_RACE} className="px-1 text-xs font-semibold text-[#c0262d]">
            Cần rút đăng ký
          </span>
        ) : (
          blockReason && <span className="px-1 text-xs text-[#946330]">{blockReason}</span>
        )}
      </div>
    );
  } else if (isPast) {
    content = null;
  } else if (blockReason) {
    content = (
      <span aria-label={`${horse.Ten}: ${blockReason}`} className="flex min-h-[40px] items-center justify-center text-[#b9ab90]">
        —
      </span>
    );
  } else {
    content = (
      <button
        key="register"
        type="button"
        onClick={onRegister}
        disabled={saving}
        aria-label={`Đăng ký ${horse.Ten} vào ${race.TenGiai}`}
        className={`flex min-h-[40px] w-full cursor-pointer items-center justify-center rounded-[2px] text-[#b9ab90] transition-colors hover:bg-[#f0efec] hover:text-[#c2570c] disabled:cursor-wait ${FOCUS}`}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <td
      onMouseEnter={onHover}
      onFocus={onHover}
      onBlur={onLeave}
      className={`group border-b border-[#d9cfba] p-1.5 align-middle ${isFirst ? "" : "border-l border-l-[#d9cfba]"} ${
        rowHighlighted ? "bg-[#f0efec]" : ""
      }`}
    >
      {content}
    </td>
  );
}
