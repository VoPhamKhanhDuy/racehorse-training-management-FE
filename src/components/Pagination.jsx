import { ChevronLeft, ChevronRight } from "lucide-react";

// Phân trang: "Hiển thị x–y trên tổng" + Trước / số trang / Sau. Tự ẩn khi chỉ có 1 trang.
export default function Pagination({ currentPage, pageSize, totalItems, onPageChange, itemLabel = "mục" }) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const navButtonClass =
    "flex h-9 cursor-pointer items-center gap-1 rounded-sm px-3 text-sm font-medium text-ink transition-colors hover:bg-brass/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone/30 px-5 py-3">
      <p className="text-sm text-stone">
        Hiển thị {from}–{to} trên {totalItems} {itemLabel}
      </p>
      <nav className="flex items-center gap-1" aria-label="Phân trang">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={navButtonClass}
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`h-9 min-w-9 cursor-pointer rounded-sm px-2 text-sm font-medium transition-colors ${
              page === currentPage ? "bg-brass text-ink" : "text-ink hover:bg-brass/10"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={navButtonClass}
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
