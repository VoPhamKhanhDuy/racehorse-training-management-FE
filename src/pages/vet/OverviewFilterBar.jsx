import { ChevronDown, Search } from "lucide-react";
import { PERIODS } from "../../utils/dateRange";

const FIELD =
  "h-10 w-full rounded-[4px] border border-[#E3E3E3] bg-white text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]";

// Dòng lọc phía trên bảng của Tổng quan sức khỏe: ô tìm theo tên ngựa + (dropdown phụ) + dropdown "Thời gian" (kèm hai ô ngày khi "Tùy chọn")
// + "Xóa lọc" khi có bộ lọc đang bật. filters: { keyword, extra, period, from, to }; onChange(patch). extra: { label, options: [{value,label}] } tùy chọn.
export default function OverviewFilterBar({ filters, onChange, onClear, active, extra, periodLabel = "Thời gian", rangeError }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <label htmlFor="overviewKeyword" className="sr-only">
            Tìm theo tên ngựa
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
          <input
            id="overviewKeyword"
            type="search"
            placeholder="Tìm theo tên ngựa"
            value={filters.keyword}
            onChange={(e) => onChange({ keyword: e.target.value })}
            className={`${FIELD} pr-3 pl-9 placeholder:text-[#6b6b6b]/70`}
          />
        </div>

        {extra && (
          <div className="relative w-full sm:w-48">
            <label htmlFor="overviewExtra" className="sr-only">
              {extra.label}
            </label>
            <select
              id="overviewExtra"
              value={filters.extra}
              onChange={(e) => onChange({ extra: e.target.value })}
              className={`${FIELD} cursor-pointer appearance-none pr-9 pl-3.5`}
            >
              {extra.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
          </div>
        )}

        <div className="relative w-full sm:w-48">
          <label htmlFor="overviewPeriod" className="sr-only">
            {periodLabel}
          </label>
          <select
            id="overviewPeriod"
            value={filters.period}
            onChange={(e) => onChange({ period: e.target.value })}
            className={`${FIELD} cursor-pointer appearance-none pr-9 pl-3.5`}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.value === "all" ? `${periodLabel}: Tất cả` : p.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
        </div>

        {filters.period === "custom" && (
          <>
            <label className="flex items-center gap-2 text-sm whitespace-nowrap text-[#6b6b6b]">
              Từ ngày
              <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => onChange({ from: e.target.value })} className={`${FIELD} w-40 px-2.5`} />
            </label>
            <label className="flex items-center gap-2 text-sm whitespace-nowrap text-[#6b6b6b]">
              Đến ngày
              <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => onChange({ to: e.target.value })} className={`${FIELD} w-40 px-2.5`} />
            </label>
          </>
        )}

        {active && (
          <button type="button" onClick={onClear} className="cursor-pointer text-sm font-semibold text-[#c2570c] hover:underline">
            Xóa lọc
          </button>
        )}
      </div>
      {rangeError && <p className="mt-2 text-sm text-[#c0262d]">{rangeError}</p>}
    </div>
  );
}
