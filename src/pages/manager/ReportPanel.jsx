// 1 nửa của khối báo cáo: tiêu đề serif + dải số liệu (chia bằng vạch dọc hairline) + nội dung bên dưới.
// Không có viền/card riêng — trang Reports ghép 2 nửa trong cùng 1 khung, ngăn bằng 1 đường kẻ hairline.
export default function ReportPanel({ title, description, metrics, children }) {
  return (
    <section className="min-w-0">
      <div className="px-5 pt-5">
        <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-sm text-stone">{description}</p>
      </div>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-stone/15 border-y border-stone/15">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 px-3 py-3 sm:px-5">
            <dt className="text-xs font-medium text-stone sm:text-sm">{metric.label}</dt>
            <dd className="mt-0.5 truncate font-serif text-lg leading-tight font-semibold text-ink sm:text-2xl" title={String(metric.value)}>
              {metric.value}
            </dd>
            {metric.hint && <dd className="mt-0.5 truncate text-xs text-stone" title={metric.hint}>{metric.hint}</dd>}
          </div>
        ))}
      </dl>

      {/* pb-8: chừa khoảng thở dưới hàng cuối, không sát mép khung */}
      <div className="px-5 pt-4 pb-8">{children}</div>
    </section>
  );
}
