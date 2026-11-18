const PAGE_SIZES = [5, 10, 20];

const PAGER_BUTTON =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-[#cfc4ad] bg-white text-base leading-none text-[#2b2118] transition-colors hover:bg-[#f0efec] disabled:cursor-not-allowed disabled:text-[#b8ad98] disabled:hover:bg-white";

// Chân bảng dạng thanh phân trang (phân trang phía FE trên mảng đã lọc).
// Trái: "{từ}–{đến} trong {tổng} giáo án"; phải: chọn số dòng + ‹ trang hiện tại ›. Màn hẹp xếp 2 dòng, nút canh phải.
// unit / prefix: chữ đơn vị và tiền tố của vế trái (mặc định "giáo án"; trang khác truyền "con ngựa", "Hiển thị ").
export default function PlanPagination({
  total,
  page,
  pageSize,
  pageSizes = PAGE_SIZES,
  unit = "giáo án",
  prefix = "",
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex min-h-12 flex-col items-start justify-center gap-2 rounded-b border-t border-[#d9cfba] bg-white px-4 py-2 text-sm text-[#4a3f33] sm:flex-row sm:items-center sm:justify-between">
      <span>
        {total === 0 ? (
          `0 ${unit}`
        ) : (
          <>
            {prefix}
            <b className="font-semibold text-[#2b2118]">
              {from}–{to}
            </b>{" "}
            trong <b className="font-semibold text-[#2b2118]">{total}</b> {unit}
          </>
        )}
      </span>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <label htmlFor="planPageSize" className="text-[#6b6055]">
          Số dòng
        </label>
        <select
          id="planPageSize"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 cursor-pointer rounded border border-[#cfc4ad] bg-white px-2 text-sm text-[#2b2118] outline-none focus:border-[#c2570c]"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button type="button" aria-label="Trang trước" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={PAGER_BUTTON}>
            ‹
          </button>
          <span className="min-w-12 text-center text-[#2b2118]" aria-live="polite">
            {totalPages > 1 ? `Trang ${page} / ${totalPages}` : page}
          </span>
          <button
            type="button"
            aria-label="Trang sau"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className={PAGER_BUTTON}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
