import { useEffect, useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import HorseAvatar from "../../components/HorseAvatar";
import { FEED_COMPONENTS, FEED_MEALS } from "../../data/feedingOptions";
import { getCareLogs, subscribeCareLogs } from "../../services/careLogMock";
import { generateDailyCareTasks } from "../../utils/careDailyTasks";
import { todayISO } from "../../utils/date";

const SECTION_TITLE = "font-serif text-base font-semibold text-[#2b2118]";
const formatNumber = (value) => (Math.round(value * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
// 0 / không có → "—"
const formatAmount = (value, unit) => (Number(value) > 0 ? `${formatNumber(Number(value))} ${unit}` : "—");
const hhmm = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// Chi tiết 1 chuồng (chỉ xem, modal giữa màn hình rộng ≤ 560px): đầu = ảnh + tên ngựa + "Chuồng A1 · Dãy A — Thi đấu"; "Ghi chú chuồng"
// (nội dung LichSinhHoat của BE — thực chất là ghi chú); "Khẩu phần" theo bữa + "Cả ngày"; "Việc chăm sóc hôm nay" của ngựa này (chỉ đọc).
// KHÔNG hiển thị chẩn đoán sức khỏe.
export default function StableDetailDialog({ stable, code, groupLabel, horse, feeding, onClose }) {
  const [logs, setLogs] = useState({});
  const name = horse?.Ten ?? `Ngựa #${stable.HorseID}`;

  useEffect(() => {
    let ignore = false;
    const load = () =>
      getCareLogs().then((value) => {
        if (!ignore) setLogs(value);
      });
    load();
    const unsubscribe = subscribeCareLogs(load);
    return () => {
      ignore = true;
      unsubscribe();
    };
  }, []);

  const meals = FEED_MEALS.map((meal) => ({ meal, plan: feeding.find((f) => f.Bua === meal) })).filter((m) => m.plan);
  const totals = Object.fromEntries(FEED_COMPONENTS.map((c) => [c.field, meals.reduce((sum, m) => sum + Number(m.plan[c.field] || 0), 0)]));
  const tasks = generateDailyCareTasks({
    date: todayISO(),
    horses: [{ HorseID: stable.HorseID, Ten: name, SoChuong: code }],
    feedingPlans: feeding,
  });
  const note = (stable.LichSinhHoat ?? "").trim();

  const header = (
    <div className="flex items-center gap-3">
      <HorseAvatar horse={horse} size={48} square />
      <div className="min-w-0">
        <h2 className="truncate font-serif text-xl leading-tight font-semibold text-[#2b2118]">{name}</h2>
        <p className="mt-0.5 text-sm text-[#6b6055]">
          Chuồng {code} · {groupLabel}
        </p>
      </div>
    </div>
  );

  const footer = (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50"
      >
        Đóng
      </button>
    </div>
  );

  return (
    <CenterDialog label={`Chuồng ${code}`} header={header} footer={footer} onClose={onClose} narrow>
      <section>
        <h3 className={SECTION_TITLE}>Ghi chú chuồng</h3>
        <p className="mt-2 text-sm whitespace-pre-line text-[#2b2118]">{note || <span className="text-[#6b6055]">Chưa có ghi chú.</span>}</p>
      </section>

      <section className="mt-6 border-t border-stone/15 pt-6">
        <h3 className={SECTION_TITLE}>Khẩu phần</h3>
        {meals.length === 0 ? (
          <p className="mt-2 text-sm text-[#6b6055]">Chưa có khẩu phần.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-[#E3E3E3] text-[13px] text-[#1f1f1f]">
                <th scope="col" className="py-1.5 text-left font-semibold">
                  Bữa
                </th>
                {FEED_COMPONENTS.map((c) => (
                  <th key={c.field} scope="col" className="py-1.5 text-right font-semibold">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meals.map(({ meal, plan }) => (
                <tr key={plan.FeedID} className="border-b border-[#E3E3E3]">
                  <th scope="row" className="py-2 text-left font-medium text-[#1f1f1f]">
                    {meal}
                  </th>
                  {FEED_COMPONENTS.map((c) => (
                    <td key={c.field} className={`py-2 text-right tabular-nums ${Number(plan[c.field]) > 0 ? "text-[#1f1f1f]" : "text-[#B5B5B5]"}`}>
                      {formatAmount(plan[c.field], c.unit)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-2 text-left font-semibold text-[#1f1f1f]">
                  Cả ngày
                </th>
                {FEED_COMPONENTS.map((c) => (
                  <td key={c.field} className="py-2 text-right font-semibold text-[#1f1f1f] tabular-nums">
                    {formatAmount(totals[c.field], c.unit)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-6 border-t border-stone/15 pt-6">
        <h3 className={SECTION_TITLE}>Việc chăm sóc hôm nay</h3>
        {tasks.length === 0 ? (
          <p className="mt-2 text-sm text-[#6b6055]">Hôm nay chưa có việc nào cho ngựa này.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {tasks.map((task) => {
              const log = logs[task.key];
              return (
                <li key={task.key} className="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-x-3 text-sm">
                  <span className="text-[#6b6055] tabular-nums">{task.time}</span>
                  <span className="min-w-0 truncate text-[#2b2118]" title={task.detail ? `${task.label} — ${task.detail}` : task.label}>
                    {task.label}
                    {task.detail && <span className="text-[#6b6055]"> · {task.detail}</span>}
                  </span>
                  <span className={`whitespace-nowrap ${log ? "font-semibold text-[#4d6b2a]" : "text-[#6b6055]"}`}>
                    {log ? `Đã xong ${hhmm(log.completedAt)}` : "Chưa làm"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </CenterDialog>
  );
}
