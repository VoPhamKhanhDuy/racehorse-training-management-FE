import { useEffect } from "react";
import { Link } from "react-router-dom";

const TOAST_MS = 3500;
const TOAST_WITH_LINK_MS = 7000; // có liên kết thì giữ lâu hơn để kịp bấm

// Thông báo nổi đáy màn hình, tự ẩn sau vài giây (cùng kiểu toast ở màn Đăng ký thi đấu).
// toast: { text, error, link: { to, label } } hoặc null; onClose: ẩn toast.
export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, toast.link ? TOAST_WITH_LINK_MS : TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded-md border border-l-2 border-gridline bg-white px-4 py-3 text-sm shadow-lg ${
        toast.error ? "border-l-[#9e5954] text-[#9e5954]" : "border-l-green-700 text-green-800"
      }`}
    >
      <span>
        {toast.text}
        {toast.link && (
          <Link to={toast.link.to} onClick={onClose} className="ml-2 font-semibold whitespace-nowrap text-brass-deep underline-offset-2 hover:underline">
            {toast.link.label}
          </Link>
        )}
      </span>
      <button type="button" onClick={onClose} className="shrink-0 cursor-pointer text-xs font-semibold text-stone hover:text-ink">
        Đóng
      </button>
    </div>
  );
}
