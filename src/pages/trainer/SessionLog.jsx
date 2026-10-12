import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { SESSION_UNITS } from "../../data/trainingSessionOptions";
import { addDays, formatDate, formatDayMonth, startOfWeek } from "../../utils/date";

const formatNumber = (value, decimals = 0) => value.toLocaleString("vi-VN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });

// Độ dài thanh dữ liệu theo vị trí giá trị trong khoảng min–max của chính ngựa đó (min = 15%, max = 100%)
const barWidth = (value, min, max) => `${max === min ? 100 : 15 + ((value - min) / (max - min)) * 85}%`;

function ValueBar({ value, min, max, colorClass }) {
  return (
    <span aria-hidden="true" className="mt-1 block h-[3px] w-full max-w-[110px] bg-track">
      <span className={`block h-full ${colorClass}`} style={{ width: barWidth(value, min, max) }} />
    </span>
  );
}

// Nhật ký buổi tập: nhóm theo tuần (Thứ Hai đầu tuần, như Lịch tập), mới nhất trước.
// Mỗi buổi 1 dòng (desktop): ngày | nhịp tim | vận tốc | chỉ số tập | nhận xét (~40%, tối đa 3 dòng);
// dưới vận tốc và chỉ số tập là thanh dữ liệu 3px (rộng tối đa 110px), nhịp tim chỉ hiện số.
// Buổi mới nhất nền be nhạt; buổi chỉ số tập cao nhất có nhãn "CAO NHẤT". activeId: đang trỏ trên biểu đồ.
export default function SessionLog({ sessions, activeId, onActivate }) {
  const newest = [...sessions].sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.SessionID - a.SessionID);
  const range = (field) => [Math.min(...sessions.map((s) => s[field])), Math.max(...sessions.map((s) => s[field]))];
  const [speedMin, speedMax] = range("VanToc");
  const [indexMin, indexMax] = range("ChiSoTap");
  const bestId = sessions.reduce((best, s) => (!best || s.ChiSoTap > best.ChiSoTap ? s : best), null)?.SessionID;
  const latestId = newest[0]?.SessionID;
  const weeks = newest.reduce((groups, s) => {
    const week = startOfWeek(s.Ngay);
    const group = groups[groups.length - 1];
    if (group?.week === week) group.items.push(s);
    else groups.push({ week, items: [s] });
    return groups;
  }, []);

  return (
    <section aria-label="Nhật ký buổi tập" className="mt-8">
      <h3 className="font-serif text-lg font-semibold text-ink">Nhật ký buổi tập</h3>
      <div className="mt-3 hidden gap-3 px-2 text-xs text-stone md:grid md:grid-cols-[6rem_4.5rem_minmax(0,110px)_minmax(0,110px)_40%_1.75rem]">
        <span>Ngày</span>
        <span>Nhịp tim</span>
        <span>Vận tốc</span>
        <span>Chỉ số tập</span>
        <span>Nhận xét</span>
        <span />
      </div>

      {weeks.map((group) => (
        <div key={group.week} className="mt-3">
          <p className="flex items-center gap-3 text-xs text-stone">
            <span className="shrink-0">
              Tuần {formatDayMonth(group.week)} – {formatDayMonth(addDays(group.week, 6))}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-gridline" />
            {/* Tóm tắt tuần căn phải: số buổi + vận tốc trung bình */}
            <span className="shrink-0 tabular-nums">
              {group.items.length} buổi · TB{" "}
              {formatNumber(group.items.reduce((sum, s) => sum + s.VanToc, 0) / group.items.length, 1)} {SESSION_UNITS.VanToc}
            </span>
          </p>
          <ul>
            {group.items.map((s) => (
              <li
                key={s.SessionID}
                onMouseEnter={() => onActivate(s.SessionID)}
                onMouseLeave={() => onActivate(null)}
                className={`group grid grid-cols-3 gap-x-3 gap-y-2 border-b border-gridline px-2 py-3 transition-colors md:grid-cols-[6rem_4.5rem_minmax(0,110px)_minmax(0,110px)_40%_1.75rem] md:items-start ${
                  s.SessionID === activeId ? "bg-brass/10" : s.SessionID === latestId ? "bg-brass/5" : ""
                }`}
              >
                {/* Điện thoại: dòng 1 = ngày (+ nút sửa), dòng 2 = 3 số liệu, dòng 3 = nhận xét */}
                <div className="col-span-2 md:col-span-1">
                  <p className="text-sm font-semibold text-ink tabular-nums">{formatDate(s.Ngay)}</p>
                  {s.SessionID === bestId && <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-moss uppercase">Cao nhất</p>}
                </div>
                <Link
                  to={`/trainer/sessions/${s.SessionID}/edit`}
                  aria-label={`Sửa buổi tập ngày ${formatDate(s.Ngay)}`}
                  title="Sửa buổi tập"
                  className="col-start-3 row-start-1 flex h-7 w-7 items-center justify-center justify-self-end rounded-sm text-stone transition hover:bg-black/5 hover:text-ink focus:opacity-100 md:col-start-6 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <div className="md:col-start-2 md:row-start-1">
                  <p className="text-sm text-ink tabular-nums">
                    {s.NhipTim} <span className="text-xs text-stone">{SESSION_UNITS.NhipTim}</span>
                  </p>
                </div>
                <div className="md:col-start-3 md:row-start-1">
                  <p className="text-sm text-ink tabular-nums">
                    {formatNumber(s.VanToc, 1)} <span className="text-xs text-stone">{SESSION_UNITS.VanToc}</span>
                  </p>
                  <ValueBar value={s.VanToc} min={speedMin} max={speedMax} colorClass="bg-bark" />
                </div>
                <div className="md:col-start-4 md:row-start-1">
                  <p className="leading-none text-ink">
                    <span className="font-serif text-[20px] font-semibold tabular-nums">{s.ChiSoTap}</span>
                    <span className="text-xs text-stone">/100</span>
                  </p>
                  <ValueBar value={s.ChiSoTap} min={indexMin} max={indexMax} colorClass="bg-brass" />
                </div>
                <p
                  title={s.NhanXet}
                  className="col-span-3 line-clamp-3 text-sm text-stone italic md:col-span-1 md:col-start-5 md:row-start-1"
                >
                  {s.NhanXet}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
