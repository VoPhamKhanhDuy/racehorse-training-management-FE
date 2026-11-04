import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NO_RANK } from "../../utils/raceResult";

const WIDTH = 260;
const GAP = 6;
const EDGE = 8;

// Popover nhỏ nhập thứ hạng cho 1 ngựa ở 1 giải đã diễn ra, gắn vào ô vừa bấm (anchor: DOMRect của ô).
// Dùng position: fixed để không bị khung cuộn ngang của ma trận cắt mất. Đóng bằng Esc / bấm ra ngoài / cuộn trang.
// entries: các đăng ký của giải [{ HorseID, ThuHang, horseName }] — để giới hạn 1…N và chặn trùng hạng.
// onSave(thuHang): null | 0 | 1…N.
export default function RaceResultPopover({ horse, race, registration, entries, anchor, saving, onSave, onClose }) {
  const rootRef = useRef(null);
  const [value, setValue] = useState(registration.ThuHang === null ? "" : String(registration.ThuHang));
  const [position, setPosition] = useState({ top: anchor.bottom + GAP, left: anchor.left });

  // Canh dưới ô; không đủ chỗ thì lật lên trên; không tràn mép phải/trái màn hình
  useLayoutEffect(() => {
    const height = rootRef.current?.offsetHeight ?? 0;
    const below = anchor.bottom + GAP;
    const top = below + height > window.innerHeight - EDGE ? Math.max(EDGE, anchor.top - GAP - height) : below;
    const left = Math.min(Math.max(EDGE, anchor.left), window.innerWidth - WIDTH - EDGE);
    setPosition({ top, left });
  }, [anchor]);

  useEffect(() => {
    rootRef.current?.querySelector("select")?.focus();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handleMouseDown = (e) => {
      if (!rootRef.current?.contains(e.target)) onClose();
    };
    const handleScroll = (e) => {
      if (!rootRef.current?.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  const rank = value === "" ? null : Number(value);
  const takenBy = rank >= 1 ? entries.find((e) => e.HorseID !== horse.HorseID && e.ThuHang === rank) : null;
  const error = takenBy ? `Thứ hạng ${rank} đã được gán cho ${takenBy.horseName}` : "";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!error) onSave(rank);
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={`Nhập kết quả: ${horse.Ten} · ${race.TenGiai}`}
      className="fixed z-40 rounded-md border border-stone/20 bg-white p-4 shadow-lg"
      style={{ top: position.top, left: position.left, width: WIDTH }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <p className="font-serif text-[15px] leading-snug font-semibold text-ink">
          {horse.Ten} <span className="font-normal text-stone">·</span> {race.TenGiai}
        </p>

        <label htmlFor="raceRank" className="mt-3 mb-1 block text-xs text-stone">
          Thứ hạng
        </label>
        <select
          id="raceRank"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={Boolean(error)}
          className={`w-full cursor-pointer rounded-md border bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:ring-2 focus:ring-brass/20 ${
            error ? "border-alert" : "border-stone/25 focus:border-brass"
          }`}
        >
          <option value="">—</option>
          {entries.map((_, index) => (
            <option key={index + 1} value={index + 1}>
              {index + 1}
            </option>
          ))}
          <option value={NO_RANK}>Không xếp hạng</option>
        </select>
        {error && <p className="mt-1.5 text-sm text-alert">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-sm border border-stone/30 px-4 text-sm font-semibold text-ink transition-colors hover:border-stone/50 hover:bg-black/[0.03]"
          >
            Hủy
          </button>
          <button type="submit" disabled={saving || Boolean(error)} className="btn-primary">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
}
