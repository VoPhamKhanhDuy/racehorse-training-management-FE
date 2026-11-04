import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Ngăn trượt từ phải (rộng 480px; màn hẹp dưới 900px chiếm toàn chiều rộng) có lớp phủ mờ.
// Đóng bằng nút X, phím Esc hoặc bấm ra ngoài. Mở thì đưa focus vào nút X, đóng thì trả focus về chỗ cũ.
// header: phần đầu (ảnh, tên...); footer: hàng nút cuối (có thể bỏ trống); label: tên cho trình đọc màn hình.
// narrow: bản hẹp 400px (thay vì 480px) cho nội dung ngắn.
export default function Drawer({ open, label, header, footer, onClose, children, narrow = false }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    // Khóa cuộn trang phía sau khi ngăn đang mở
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-[#232328]/20" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute inset-y-0 right-0 flex w-full animate-drawer-in flex-col bg-white shadow-xl ${narrow ? "min-[900px]:w-[400px]" : "min-[900px]:w-[480px]"}`}
      >
        <div className="flex items-start gap-3 border-b border-stone/15 px-5 py-4">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-m-1 shrink-0 cursor-pointer rounded-sm p-1 text-stone outline-none hover:text-ink focus-visible:outline-2 focus-visible:outline-brass"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-stone/15 px-5 py-4">{footer}</div>}
      </aside>
    </div>
  );
}
