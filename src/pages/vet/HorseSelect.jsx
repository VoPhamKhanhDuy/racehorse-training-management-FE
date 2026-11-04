import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";

// Dropdown "Ngựa" có ảnh nhỏ 20px (thẻ <select> gốc không hiện được ảnh trong từng mục).
// value: HorseID đang chọn (null = Tất cả). Bàn phím: Enter/Space/↓ mở, ↑↓ di chuyển, Enter chọn, Esc đóng.
export default function HorseSelect({ horses, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = useId();
  const options = [{ HorseID: null, Ten: "Tất cả ngựa" }, ...horses];
  const selected = options.find((o) => o.HorseID === value) ?? options[0];

  // Bấm ra ngoài thì đóng
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
    onChange(option.HorseID);
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

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Lọc theo ngựa: ${selected.Ten}`}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`flex h-9 min-w-[170px] cursor-pointer items-center gap-2 rounded-full border bg-white pr-3 pl-2 text-sm text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brass/40 ${
          value ? "border-brass bg-brass/10" : "border-stone/25 hover:border-stone/40"
        }`}
      >
        {value ? <HorseAvatar horse={selected} size={20} /> : <span className="w-1" />}
        <span className="flex-1 truncate text-left">{selected.Ten}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-stone" aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Chọn ngựa"
          className="absolute top-full left-0 z-30 mt-1 max-h-72 w-56 overflow-y-auto rounded-md border border-stone/15 bg-white py-1 shadow-lg"
        >
          {options.map((option, index) => {
            const isSelected = option.HorseID === selected.HorseID;
            return (
              <li
                key={option.HorseID ?? "all"}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(option)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm ${index === activeIndex ? "bg-track/60" : ""} ${
                  isSelected ? "font-medium text-brass-deep" : "text-ink"
                }`}
              >
                {option.HorseID ? <HorseAvatar horse={option} size={20} /> : <span className="w-5" />}
                <span className="flex-1">{option.Ten}</span>
                {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
