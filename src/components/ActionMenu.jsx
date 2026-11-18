import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Ellipsis } from "lucide-react";

const ITEM = "block w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#faf6ee] focus:bg-[#faf6ee] focus:outline-none";

// Menu "⋯" gom các thao tác phụ. items: [{ key, label, to?, onClick?, danger? }] — có `to` thì là link, không thì là nút.
export default function ActionMenu({ items, ariaLabel = "Thao tác" }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  // Đóng khi click ra ngoài hoặc nhấn Escape (trả focus về nút ⋯)
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-[#d9d0bf] bg-white text-[#2b2118] transition-colors hover:border-[#6b6055]/50"
      >
        <Ellipsis className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={ariaLabel}
          className="absolute top-full right-0 z-30 mt-1 w-52 rounded border border-[#d9d0bf] bg-white py-1"
        >
          {items.map((item) => {
            const className = `${ITEM} ${item.danger ? "text-[#c0262d]" : "text-[#2b2118]"}`;
            return item.to ? (
              <Link key={item.key} to={item.to} role="menuitem" onClick={() => setOpen(false)} className={className}>
                {item.label}
              </Link>
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={className}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
