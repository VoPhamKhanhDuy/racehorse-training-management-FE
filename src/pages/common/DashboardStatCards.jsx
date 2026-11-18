import { Fragment } from "react";
import { Link } from "react-router-dom";
import { formatPercent } from "../../utils/number";

function KpiCard({ label, value, percent, sub, valueClass, hoverClass, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer flex-col rounded-lg border border-[#e2d9c8] bg-white px-4 py-3 text-left leading-tight transition-colors ${hoverClass}`}
    >
      <span className="text-sm text-[#6b6055]">{label}</span>
      <span className="mt-1 flex items-baseline gap-2">
        <span className={`font-serif text-2xl font-bold ${valueClass}`}>{value}</span>
        {percent != null && <span className="text-sm text-[#6b6055]">{formatPercent(percent)}</span>}
      </span>
      {sub && <span className="mt-0.5 text-xs text-[#6b6055]">{sub}</span>}
    </button>
  );
}

// 4 thẻ sức khỏe đàn ngựa (bấm để lọc bảng) + thanh phân bổ mỏng + một thanh việc cần xử lý.
// Mục `warn` có số > 0 thì số đổi sang màu cam đậm.
export default function DashboardStatCards({ counts, breedsCount, avgAge, segments, onFilter, stats }) {
  const { total, fit, watch, treating, locked } = counts;
  const percentOf = (count) => (total > 0 ? (count / total) * 100 : 0);
  const breedLine = [`${breedsCount} giống`, avgAge !== "—" && `TB ${avgAge} tuổi`].filter(Boolean).join(" · ");

  return (
    <>
      <div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Tổng số ngựa"
            value={total}
            sub={breedLine}
            valueClass="text-[#2b2118]"
            hoverClass="hover:border-[#b9ab90]"
            onClick={() => onFilter("all")}
          />
          <KpiCard
            label="Đủ điều kiện"
            value={fit}
            percent={percentOf(fit)}
            valueClass="text-[#4d6b2a]"
            hoverClass="hover:border-[#b9ab90]"
            onClick={() => onFilter("fit")}
          />
          <KpiCard
            label="Cần theo dõi"
            value={watch}
            percent={percentOf(watch)}
            valueClass="text-[#c2570c]"
            hoverClass="hover:border-[#b9ab90]"
            onClick={() => onFilter("watch")}
          />
          <KpiCard
            label="Điều trị / chấn thương"
            value={treating}
            percent={percentOf(treating)}
            sub={`Khóa tập: ${locked}`}
            valueClass="text-[#b3473f]"
            hoverClass="hover:border-[#b9ab90]"
            onClick={() => onFilter("treating_all")}
          />
        </div>

        {total > 0 && (
          <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-[#f0ebe1]" aria-hidden="true">
            {segments
              .filter((s) => s.count > 0)
              .map((s) => (
                <div key={s.key} style={{ width: `${percentOf(s.count)}%` }} className={s.color} />
              ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[#e2d9c8] bg-white px-4 py-2 text-sm text-[#6b6055]">
        {stats.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && <span aria-hidden="true">·</span>}
            <Link to={item.to} className="hover:text-[#2b2118] hover:underline">
              {item.label}{" "}
              <b className={item.warn && item.value > 0 ? "text-[#c2570c]" : "text-[#2b2118]"}>{item.value}</b>
            </Link>
          </Fragment>
        ))}
      </div>
    </>
  );
}
