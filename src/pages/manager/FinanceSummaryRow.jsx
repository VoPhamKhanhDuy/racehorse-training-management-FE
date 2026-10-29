import { Link } from "react-router-dom";
import { formatCompactCurrency } from "../../utils/currency";
import { formatDate, todayISO } from "../../utils/date";


// Hàng tóm tắt chi phí / tiền thưởng của CÂU LẠC BỘ trong năm hiện tại, đặt trên 2 khối của trang Báo cáo.
// 2 ô KPI cùng style với ReportPanel (nhãn nhỏ trên, số serif lớn, ghi chú nhỏ dưới); bên phải: link "Xem chi tiết" →
// /manager/finance và chú thích năm / ngày. summary: { cost, prize } (VNĐ) — cùng nguồn với /manager/finance.
export default function FinanceSummaryRow({ summary }) {
  const today = todayISO();
  const year = today.slice(0, 4);

  const metrics = [
    { label: "Tổng chi phí", value: formatCompactCurrency(summary.cost), hint: "các khoản đã ghi" },
    { label: "Tổng tiền thưởng", value: formatCompactCurrency(summary.prize), hint: "của các giải đã diễn ra" },
  ];

  return (
    <div className="mb-4 flex flex-col rounded-lg border border-stone/15 bg-white lg:flex-row">
      <dl className="grid min-w-0 flex-1 grid-cols-2 divide-x divide-stone/15">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 px-3 py-3 sm:px-5">
            <dt className="text-xs font-medium text-stone sm:text-sm">{metric.label}</dt>
            <dd
              className={`mt-0.5 truncate font-serif text-lg leading-tight font-semibold sm:text-2xl ${metric.valueClass ?? "text-ink"}`}
              title={metric.value}
            >
              {metric.value}
            </dd>
            <dd className="mt-0.5 truncate text-xs text-stone" title={metric.hint}>
              {metric.hint}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex shrink-0 flex-col justify-center gap-1 border-t border-stone/15 px-5 py-3 lg:items-end lg:border-t-0 lg:border-l">
        <Link to="/manager/finance" className="text-sm font-medium text-[#c2570c] no-underline hover:underline">
          Xem chi tiết
        </Link>
        <p className="text-xs text-stone">
          Năm {year} · tính đến {formatDate(today)}
        </p>
      </div>
    </div>
  );
}
