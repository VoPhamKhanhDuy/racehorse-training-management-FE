import { Plus } from "lucide-react";
import { formatDayMonth } from "../../utils/date";

const NOTE_BROWN = "text-[#946330]";

// Ô giao ngựa × giải:
// - đã đăng ký: chip 1 dòng viền cam "Đã đăng ký 28/09"; bấm để hủy (giải đã diễn ra: chỉ xem).
//   Ngựa bị chặn mà vẫn đang đăng ký: chữ nâu lý do ngay bên phải chip, vẫn cho hủy.
// - chưa đăng ký, đủ điều kiện: ô trống, dấu "+" chỉ hiện khi rê chuột/focus; bấm để đăng ký.
// - bị chặn (khóa tập / đang điều trị): "—" xám nhạt, không bấm được. Giải đã diễn ra: để trống.
// rowHighlighted: hàng đang rê chuột (nền be rất nhạt); cellHovered: ô đang rê chuột (viền hairline đậm hơn).
export default function RaceRegistrationCell({
  horse,
  race,
  registration,
  blockReason,
  isPast,
  isFirst,
  rowHighlighted,
  cellHovered,
  saving,
  onHover,
  onLeave,
  onRegister,
  onCancel,
}) {
  let content;
  if (registration) {
    const chipBody = (
      <>
        Đã đăng ký <span className="text-stone tabular-nums">{formatDayMonth(registration.NgayDangKy)}</span>
      </>
    );
    const chipClass =
      "inline-flex h-[30px] shrink-0 items-center gap-1 rounded-[6px] border border-brass/80 bg-white px-2 text-[13px] whitespace-nowrap text-bark";
    content = isPast ? (
      <span className={`${chipClass} opacity-70`} title={`${horse.Ten} đã đăng ký ${race.TenGiai}`}>
        {chipBody}
      </span>
    ) : (
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <button
          key="cancel"
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label={`Hủy đăng ký ${horse.Ten} khỏi ${race.TenGiai}`}
          title="Bấm để hủy đăng ký"
          className={`${chipClass} cursor-pointer transition-colors hover:border-brass hover:bg-brass/10 focus-visible:border-brass focus-visible:outline-none disabled:cursor-wait disabled:opacity-60`}
        >
          {chipBody}
        </button>
        {blockReason && <span className={`text-[11px] whitespace-nowrap ${NOTE_BROWN}`}>{blockReason}</span>}
      </div>
    );
  } else if (isPast) {
    content = null;
  } else if (blockReason) {
    content = (
      <span aria-label={`${horse.Ten}: ${blockReason}`} className="flex items-center justify-center text-stone/40">
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
        className="flex h-[30px] w-full cursor-pointer items-center justify-center rounded-[6px] text-bark/0 transition-colors group-hover:text-bark/55 focus-visible:text-bark/55 focus-visible:outline-1 focus-visible:outline-brass/60 disabled:cursor-wait"
      >
        <Plus className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
    );
  }

  return (
    <td
      onMouseEnter={onHover}
      onFocus={onHover}
      onBlur={onLeave}
      className={`group h-[60px] border-b border-stone/10 p-3 align-middle ${isFirst ? "" : "border-l border-l-stone/10"} ${
        rowHighlighted ? "bg-[#faf7f1]" : blockReason ? "bg-stone/5" : ""
      } ${cellHovered ? "outline outline-1 -outline-offset-1 outline-stone/30" : ""}`}
    >
      {content}
    </td>
  );
}
