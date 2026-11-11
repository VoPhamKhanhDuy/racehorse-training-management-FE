import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, toISODate, todayISO } from "../utils/date";

// Ô chọn ngày dùng chung (thay <input type="date"> của trình duyệt vì nó hiện tiếng Anh và không giới hạn được năm).
// - value / min / max là "YYYY-MM-DD"; hiển thị dd/MM/yyyy, gõ tay được (tự thêm dấu "/"), bấm vào ô mở lịch tiếng Việt, tuần bắt đầu Thứ Hai.
// - Lịch có dropdown tháng + năm (năm chỉ trong khoảng min–max), nút "Hôm nay" và "Xóa" (ẩn khi required). Ngày ngoài min/max bị làm mờ, không chọn được.
// - onChange phát ra { target: { name, value } } giống input thường nên chỗ gọi vẫn dùng e.target.value; ngày gõ sai / ngoài khoảng phát "" kèm thông báo ngắn dưới ô.
// - rangeMessage(iso, min, max): tuỳ biến thông báo ngoài khoảng; emitOutOfRange: vẫn phát ngày gõ tay ngoài khoảng để form tự validate khi submit.
// - className là style của ô (do FormField / trang truyền vào); externalError: nếu form đã có lỗi riêng thì không hiện thông báo khoảng ngày của ô.
const MONTHS = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const SELECT = "h-8 cursor-pointer rounded-[4px] border border-[#E3E3E3] bg-white px-2 text-sm text-[#1f1f1f] outline-none focus:border-[#c2570c]";
const NAV = "flex h-8 w-8 cursor-pointer items-center justify-center rounded-[4px] text-[#1f1f1f] hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

const parseISO = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? "")) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
};
const toDisplay = (iso) => (parseISO(iso) ? formatDate(iso) : "");
// "06/11/2026" → "2026-11-06" hoặc null
const fromDisplay = (text) => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return parseISO(iso) ? iso : null;
};
// Tự chèn "/" khi gõ số: 06112026 → 06/11/2026
const maskDigits = (text) => {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

function rangeMessage(iso, min, max, label) {
  const name = label || "Ngày";
  if (max && iso > max) return max === todayISO() ? `${name} không được ở tương lai` : `${name} không được sau ${formatDate(max)}`;
  if (min && iso < min) return min === todayISO() ? `${name} không được ở quá khứ` : `${name} không được trước ${formatDate(min)}`;
  return "";
}

export default function DateInput({ value = "", onChange, min, max, required, disabled, className = "", label, externalError, name, id, placeholder = "dd/MM/yyyy", rangeMessage: customRangeMessage, emitOutOfRange = false, ...rest }) {
  const [text, setText] = useState(toDisplay(value));
  const [open, setOpen] = useState(false);
  const [rangeError, setRangeError] = useState("");
  const [view, setView] = useState(() => parseISO(value) ?? parseISO(max && max < todayISO() ? max : min && min > todayISO() ? min : todayISO()));
  const [pos, setPos] = useState(null);
  const inputRef = useRef(null);
  const popupRef = useRef(null);
  const autoId = useId();
  const lastEmitted = useRef(value);

  // Giá trị đổi từ bên ngoài (form reset, nút khác đổi) → đồng bộ lại chữ trong ô
  useEffect(() => {
    if (value === lastEmitted.current) return; // do chính ô này phát ra: giữ nguyên chữ đang gõ (kể cả khi ngoài khoảng)
    lastEmitted.current = value;
    setText(toDisplay(value));
  }, [value]);

  const emit = (next) => {
    lastEmitted.current = next;
    onChange?.({ target: { name, id, value: next } });
  };
  const isDisabledDay = (iso) => (min && iso < min) || (max && iso > max);

  const commitText = (raw) => {
    if (raw.trim() === "") {
      setRangeError("");
      if (value) emit("");
      return;
    }
    const iso = fromDisplay(raw);
    if (!iso) {
      if (raw.length >= 10) setRangeError(`${label || "Ngày"} không hợp lệ`);
      return;
    }
    const message = (customRangeMessage ?? rangeMessage)(iso, min, max, label);
    setRangeError(message);
    emit(message && !emitOutOfRange ? "" : iso);
    if (!message) setView(parseISO(iso));
  };

  const pick = (iso) => {
    setText(toDisplay(iso));
    setRangeError("");
    emit(iso);
    setOpen(false);
  };

  // Vị trí khung lịch (cố định theo ô, vẽ ngoài modal để không bị cắt); lật lên trên nếu hết chỗ phía dưới
  useLayoutEffect(() => {
    if (!open || !inputRef.current) return;
    const place = () => {
      const rect = inputRef.current.getBoundingClientRect();
      const height = 372;
      const top = rect.bottom + height + 8 > window.innerHeight && rect.top > height ? rect.top - height - 4 : rect.bottom + 4;
      setPos({ top, left: Math.max(8, Math.min(rect.left, window.innerWidth - 296)) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (popupRef.current?.contains(e.target) || inputRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const today = todayISO();
  const selected = value;
  const minYear = min ? Number(min.slice(0, 4)) : new Date().getFullYear() - 60;
  const maxYear = max ? Number(max.slice(0, 4)) : new Date().getFullYear() + 10;
  const years = [];
  for (let y = maxYear; y >= minYear; y -= 1) years.push(y);
  if (!years.includes(year)) years.push(year);

  const goTo = (y, m) => setView(new Date(y, m, 1));
  const prevMonthEnd = toISODate(new Date(year, month, 0));
  const nextMonthStart = toISODate(new Date(year, month + 1, 1));
  const canPrev = !min || prevMonthEnd >= min;
  const canNext = !max || nextMonthStart <= max;

  // 6 hàng × 7 ngày, bắt đầu từ Thứ Hai
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - offset + i));

  const shownError = externalError ? "" : rangeError;

  return (
    <>
      <input
        {...rest}
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        value={text}
        aria-invalid={Boolean(shownError) || rest["aria-invalid"]}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? autoId : undefined}
        onFocus={() => !disabled && setOpen(true)}
        onClick={() => !disabled && setOpen(true)}
        onChange={(e) => {
          const masked = maskDigits(e.target.value);
          setText(masked);
          setRangeError("");
          if (masked.length === 10) commitText(masked);
          else if (masked === "" && value) emit("");
        }}
        onBlur={() => {
          if (!open) commitText(text);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && open) {
            e.preventDefault();
            commitText(text);
            setOpen(false);
          }
        }}
        className={className}
      />
      {shownError && <p className="mt-1.5 text-sm text-[#c0262d]">{shownError}</p>}
      {open &&
        pos &&
        createPortal(
          <div
            ref={popupRef}
            id={autoId}
            role="dialog"
            aria-label="Chọn ngày"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: 288 }}
            className="z-[1000] rounded-[4px] border border-[#E3E3E3] bg-white p-3 text-[#1f1f1f]"
          >
            <div className="flex items-center gap-1.5">
              <button type="button" className={NAV} disabled={!canPrev} onClick={() => goTo(year, month - 1)} aria-label="Tháng trước">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <select aria-label="Tháng" value={month} onChange={(e) => goTo(year, Number(e.target.value))} className={`${SELECT} min-w-0 flex-1`}>
                {MONTHS.map((label_, i) => {
                  const monthStart = toISODate(new Date(year, i, 1));
                  const monthEnd = toISODate(new Date(year, i + 1, 0));
                  const out = (min && monthEnd < min) || (max && monthStart > max);
                  return (
                    <option key={label_} value={i} disabled={out}>
                      {label_}
                    </option>
                  );
                })}
              </select>
              <select aria-label="Năm" value={year} onChange={(e) => goTo(Number(e.target.value), month)} className={`${SELECT} w-[76px]`}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button type="button" className={NAV} disabled={!canNext} onClick={() => goTo(year, month + 1)} aria-label="Tháng sau">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-7 text-center text-xs text-[#6b6b6b]">
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-1">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date) => {
                const iso = toISODate(date);
                const inMonth = date.getMonth() === month;
                const off = isDisabledDay(iso);
                const isSelected = iso === selected;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={off}
                    onClick={() => pick(iso)}
                    aria-label={formatDate(iso)}
                    aria-pressed={isSelected}
                    className={`mx-auto my-0.5 h-8 w-8 rounded-[4px] text-sm tabular-nums transition-colors ${
                      isSelected
                        ? "bg-[#c2570c] font-semibold text-white"
                        : off
                          ? "cursor-not-allowed text-[#D0D0D0]"
                          : `cursor-pointer hover:bg-[#F5F5F5] ${inMonth ? "text-[#1f1f1f]" : "text-[#B5B5B5]"} ${iso === today ? "border border-[#c2570c]" : ""}`
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[#E3E3E3] pt-2">
              <button
                type="button"
                disabled={isDisabledDay(today)}
                onClick={() => pick(today)}
                className="cursor-pointer text-sm font-semibold text-[#c2570c] hover:underline disabled:cursor-not-allowed disabled:text-[#B5B5B5] disabled:no-underline"
              >
                Hôm nay
              </button>
              {!required && (
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    setRangeError("");
                    emit("");
                    setOpen(false);
                  }}
                  className="cursor-pointer text-sm font-semibold text-[#6b6b6b] hover:underline"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
