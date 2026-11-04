import HorseAvatar from "../../components/HorseAvatar";
import { FEED_COMPONENTS, FEED_MEALS } from "../../data/feedingOptions";

const LABEL = "text-[11px] font-medium tracking-wide text-stone uppercase";
// Dấu phẩy thập phân, tối đa 1 chữ số; làm tròn trước để tổng không bị lẻ do số thực (vd 2,5 + 2 = 4,5)
const formatNumber = (value) => (Math.round(value * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
// 0 / không có → "—"
const formatAmount = (value, unit) => (Number(value) > 0 ? `${formatNumber(Number(value))} ${unit}` : "—");

// Tách LichSinhHoat (nhiều dòng "HH:mm Việc") → [{ gio, viec }]; dòng không đúng dạng giữ nguyên làm việc, giờ rỗng
function parseSchedule(text) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d{1,2}:\d{2})\s+(.+)$/);
      return match ? { gio: match[1], viec: match[2] } : { gio: "", viec: line };
    });
}

// Chi tiết 1 chuồng (chỉ xem): lịch sinh hoạt + khẩu phần. KHÔNG hiển thị tình trạng sức khỏe / chẩn đoán.
// stable: STABLEASSIGNMENT; feeding: FEEDINGPLAN của ngựa đó.
export default function StableDetail({ stable, horse, feeding }) {
  const schedule = parseSchedule(stable.LichSinhHoat);
  const meals = FEED_MEALS.map((meal) => ({ meal, plan: feeding.find((f) => f.Bua === meal) })).filter((m) => m.plan);
  // Cộng cả ngày theo từng thành phần
  const totals = Object.fromEntries(FEED_COMPONENTS.map((c) => [c.field, meals.reduce((sum, m) => sum + Number(m.plan[c.field] || 0), 0)]));

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-stone/20 pb-4">
        <HorseAvatar horse={horse} size={64} />
        <div className="min-w-0">
          <h2 className="font-serif text-xl leading-tight font-semibold text-ink">{horse?.Ten ?? `Ngựa #${stable.HorseID}`}</h2>
          <p className="text-sm text-stone">Chuồng {stable.SoChuong}</p>
        </div>
      </div>

      <section aria-label="Lịch sinh hoạt" className="border-b border-stone/20 py-4">
        <h3 className={LABEL}>Lịch sinh hoạt</h3>
        {schedule.length === 0 ? (
          <p className="mt-2 text-sm text-stone">Chưa có lịch sinh hoạt.</p>
        ) : (
          <ul className="mt-1">
            {schedule.map((item, index) => (
              <li key={`${item.gio}-${index}`} className="flex gap-4 border-b border-stone/15 py-2 text-sm last:border-b-0">
                <span className="w-12 shrink-0 text-ink tabular-nums">{item.gio}</span>
                <span className="text-ink">{item.viec}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Khẩu phần" className="py-4">
        <h3 className={LABEL}>Khẩu phần</h3>
        {meals.length === 0 ? (
          <p className="mt-2 text-sm text-stone">Chưa có khẩu phần.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-stone/15 text-xs text-stone">
                <th scope="col" className="py-1.5 text-left font-normal">
                  Bữa
                </th>
                {FEED_COMPONENTS.map((c) => (
                  <th key={c.field} scope="col" className="py-1.5 text-right font-normal">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meals.map(({ meal, plan }) => (
                <tr key={plan.FeedID} className="border-b border-stone/15">
                  <th scope="row" className="py-2 text-left font-medium text-ink">
                    {meal}
                  </th>
                  {FEED_COMPONENTS.map((c) => (
                    <td key={c.field} className={`py-2 text-right tabular-nums ${Number(plan[c.field]) > 0 ? "text-ink" : "text-stone"}`}>
                      {formatAmount(plan[c.field], c.unit)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-stone/40">
                <th scope="row" className="py-2 text-left font-medium text-ink">
                  Cả ngày
                </th>
                {FEED_COMPONENTS.map((c) => (
                  <td key={c.field} className="py-2 text-right font-medium text-ink tabular-nums">
                    {formatAmount(totals[c.field], c.unit)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
