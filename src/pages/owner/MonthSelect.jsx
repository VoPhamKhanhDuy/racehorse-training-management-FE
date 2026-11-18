import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

// Ô chọn tháng (dropdown tự dựng, vì thẻ <select> gốc không hiện được chữ trạng thái có màu căn phải trong từng tùy chọn).
// options: [{ value, label, statusLabel?, statusColor? }]; value: giá trị đang chọn. Ô đóng chỉ hiện label.
// Bàn phím: Enter/Space/↓ mở, ↑↓ di chuyển, Enter chọn, Esc đóng, Tab đóng. Bấm ra ngoài thì đóng.
export default function MonthSelect({ options, value, onChange, ariaLabel = "Chọn tháng" }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    const handleMouseDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const openList = () => {
    setActiveIndex(Math.max(options.indexOf(selected), 0));
    setOpen(true);
  };

  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (i + step + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  if (!selected) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${ariaLabel}: ${selected.label}`}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`flex h-10 w-full min-w-[200px] cursor-pointer items-center gap-2 rounded-[4px] border bg-white px-3 text-[15px] text-[#2b2118] outline-none transition-colors hover:bg-[#f0efec] focus:border-[#c2570c] ${
          open ? "border-[#c2570c]" : "border-[#cfc4ad]"
        } ${FOCUS_RING}`}
      >
        <span className="flex-1 text-left">{selected.label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#6b6055]" strokeWidth={2} aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute top-full left-0 z-30 mt-1 max-h-72 w-[340px] max-w-[calc(100vw-4rem)] overflow-y-auto rounded-[4px] border border-[#b9ab90] bg-white py-1"
        >
          {options.map((option, index) => {
            const isSelected = option.value === selected.value;
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(option)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-[15px] text-[#2b2118] ${index === activeIndex ? "bg-[#f0efec]" : ""} ${
                  isSelected ? "font-semibold" : ""
                }`}
              >
                <span className="flex-1">{option.label}</span>
                {option.statusLabel && (
                  <span className="text-[13px] font-normal whitespace-nowrap" style={{ color: option.statusColor }}>
                    {option.statusLabel}
                  </span>
                )}
                {isSelected && <Check className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
