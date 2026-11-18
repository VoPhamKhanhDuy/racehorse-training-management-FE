// Chân bảng chuẩn: bên trái "Hiển thị a–b trong n <đơn vị>", bên phải phân trang "Trước | 1 | 2 | Sau" (trang hiện tại nền #1f1f1f chữ trắng).
// Bảng trung tính: nền trắng, viền trên #E3E3E3, nút bo 4px.
export default function TablePager({ page, pageCount, total, pageSize, unit, onPage }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const NAV =
    "h-8 cursor-pointer rounded-[4px] border border-[#E3E3E3] bg-white px-3 font-medium text-[#1f1f1f] transition-colors hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[#E3E3E3] bg-white px-4 py-2 text-[13px] text-[#6b6b6b]">
      <span>
        Hiển thị {from}–{to} trong {total} {unit}
      </span>
      {pageCount > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-1.5">
          <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} className={NAV}>
            Trước
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined}
              className={`h-8 min-w-8 cursor-pointer rounded-[4px] border px-2 font-medium tabular-nums transition-colors ${
                n === page ? "border-[#1f1f1f] bg-[#1f1f1f] text-white" : "border-[#E3E3E3] bg-white text-[#1f1f1f] hover:bg-[#FAFAFA]"
              }`}
            >
              {n}
            </button>
          ))}
          <button type="button" onClick={() => onPage(page + 1)} disabled={page === pageCount} className={NAV}>
            Sau
          </button>
        </nav>
      )}
    </div>
  );
}
