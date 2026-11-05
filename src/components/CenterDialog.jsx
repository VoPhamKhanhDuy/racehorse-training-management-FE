import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Hộp thoại giữa màn hình dạng đầu – thân – chân: đầu và chân cố định, chỉ thân cuộn (tối đa 85vh, rộng tối đa 640px, bo 6px).
// Đóng bằng nút X, phím Esc hoặc bấm nền (không đóng khi busy). header: nội dung đầu; footer: hàng nút cuối (có thể bỏ trống).
export default function CenterDialog({ label, header, footer, onClose, busy = false, wide = false, narrow = false, maxWidth, children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, busy]);

  const handleClose = () => {
    if (!busy) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#232328]/40" onClick={handleClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={maxWidth ? { maxWidth } : undefined}
        className={`relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-md bg-white shadow-xl ${wide ? "max-w-[680px]" : narrow ? "max-w-[560px]" : "max-w-[640px]"}`}
      >
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 sm:px-8">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="-m-1 shrink-0 cursor-pointer rounded-[4px] p-1 text-stone outline-none hover:text-ink focus-visible:outline-2 focus-visible:outline-brass"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-8">{children}</div>
        {footer && <div className="border-t border-stone/15 px-6 pt-4 pb-6 sm:px-8">{footer}</div>}
      </div>
    </div>
  );
}
