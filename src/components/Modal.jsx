import { useEffect } from "react";

// Hộp thoại nổi giữa màn hình. Đóng bằng nút ×, phím Esc hoặc bấm ra ngoài.
// size: "md" (mặc định, cho form) | "sm" (cho hộp xác nhận)
export default function Modal({ open, title, onClose, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#232328]/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative max-h-[90vh] w-full overflow-y-auto ${size === "sm" ? "max-w-md" : "max-w-lg"} rounded-2xl bg-white p-6 shadow-xl sm:p-8`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-m-1 cursor-pointer rounded-lg p-1 text-[#6E6E76] hover:bg-gray-50 hover:text-[#232328]"
            aria-label="Đóng"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
