import { useState } from "react";
import { Link } from "react-router-dom";
import HorseIcon from "../../components/HorseIcon";
import SessionCharts from "./SessionCharts";
import SessionLog from "./SessionLog";
import { SESSION_UNITS } from "../../data/trainingSessionOptions";

const WINDOW = 7; // số buổi gần nhất để tính trung bình
const BAR_COUNT = 8; // số cột mini trong khối chỉ số tập
const BAR_AREA_HEIGHT = 52; // px — cột cao theo chỉ số tập 0–100

const average = (list, field) => list.reduce((sum, s) => sum + s[field], 0) / list.length;
const formatNumber = (value, decimals = 0) => value.toLocaleString("vi-VN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });

// Chi tiết kết quả buổi tập của 1 ngựa: đầu khung (ảnh vuông bo góc, tên, giống/tuổi/cân nặng),
// khối số liệu chính (chỉ số tập gần nhất + cột mini 8 buổi | vận tốc TB | nhịp tim TB), biểu đồ, nhật ký buổi tập.
export default function SessionDetail({ horse, sessions, isLocked }) {
  // Buổi đang được trỏ tới — đồng bộ biểu đồ ↔ nhật ký
  const [activeId, setActiveId] = useState(null);
  const newest = [...sessions].sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.SessionID - a.SessionID);
  const ascending = [...newest].reverse();
  const latest = newest[0];
  const previous = newest[1];
  const recent = newest.slice(0, WINDOW);
  const bars = newest.slice(0, BAR_COUNT).reverse(); // cũ → mới, cột cuối là buổi mới nhất
  // Hai ô số phụ: trung bình 7 buổi gần nhất + dòng nhỏ cao nhất / thấp nhất trên các buổi đang hiển thị
  const sideMetrics = sessions.length
    ? [
        {
          label: `Vận tốc TB ${recent.length} buổi`,
          value: formatNumber(average(recent, "VanToc"), 1),
          unit: SESSION_UNITS.VanToc,
          note: `Cao nhất ${formatNumber(Math.max(...sessions.map((s) => s.VanToc)), 1)} ${SESSION_UNITS.VanToc}`,
        },
        {
          label: `Nhịp tim TB ${recent.length} buổi`,
          value: formatNumber(average(recent, "NhipTim")),
          unit: SESSION_UNITS.NhipTim,
          note: `Thấp nhất ${Math.min(...sessions.map((s) => s.NhipTim))} ${SESSION_UNITS.NhipTim}`,
        },
      ]
    : [];
  // Dòng phụ: chỉ hiện trường HORSE có dữ liệu
  const facts = [horse.Giong, horse.Tuoi && `${horse.Tuoi} tuổi`, horse.CanNang && `${horse.CanNang.toLocaleString("vi-VN")} kg`].filter(Boolean);

  return (
    <section aria-label={`Kết quả buổi tập của ${horse.Ten}`}>
      <div className="flex flex-wrap items-start gap-4 sm:gap-5">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-stone/10 text-stone">
          {horse.photo ? (
            <img src={horse.photo} alt="" className="h-full w-full object-cover object-[center_25%]" />
          ) : (
            <HorseIcon className="h-8 w-8" />
          )}
        </span>
        <div className="min-w-48 flex-1 self-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-serif text-[30px] leading-tight font-semibold text-ink">{horse.Ten}</h2>
            {isLocked && <span className="rounded-sm border border-stone/30 px-1.5 py-px text-[11px] font-medium text-stone">Đang khóa tập</span>}
          </div>
          {facts.length > 0 && <p className="mt-0.5 text-sm text-stone">{facts.join(" · ")}</p>}
        </div>
        {/* Nút phụ dạng viền cam; ngựa đang khóa tập không ghi nhận buổi mới được */}
        <div className="self-center">
          {isLocked ? (
            <span
              title="Ngựa đang bị khóa tập, không thể ghi nhận buổi tập mới."
              className="inline-block cursor-not-allowed rounded-sm border border-stone/20 px-3.5 py-1.5 text-sm font-medium text-stone/50"
            >
              Ghi nhận buổi tập
            </span>
          ) : (
            <Link
              to={`/trainer/sessions/new?horse=${horse.HorseID}`}
              className="inline-block rounded-sm border border-brass/60 px-3.5 py-1.5 text-sm font-medium text-brass-deep transition-colors hover:border-brass hover:bg-brass/10"
            >
              Ghi nhận buổi tập
            </Link>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="mt-6 border-t border-gridline pt-6 text-sm text-stone">Chưa có buổi tập nào được ghi nhận.</p>
      ) : (
        <>
          {/* Khối số liệu chính — tách ô bằng border-l; màn hẹp xếp dọc */}
          <div className="mt-5 grid border-y border-gridline md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-wrap items-start gap-x-6 gap-y-3 py-3.5 md:flex-nowrap md:pr-6">
              <div>
                <p className="text-xs text-stone">Chỉ số tập gần nhất</p>
                <p className="mt-1 leading-none">
                  <span className="font-serif text-[56px] leading-none font-semibold text-bark tabular-nums">{latest.ChiSoTap}</span>
                  <span className="ml-1 text-sm text-stone">/100</span>
                </p>
                {previous && (
                  <p className="mt-2 text-xs text-moss">
                    {latest.ChiSoTap - previous.ChiSoTap > 0 ? "+" : latest.ChiSoTap - previous.ChiSoTap < 0 ? "−" : "±"}
                    {Math.abs(latest.ChiSoTap - previous.ChiSoTap)} điểm so với buổi trước
                  </p>
                )}
              </div>
              {/* Cột mini 8 buổi gần nhất: cột mới nhất cam thương hiệu, các cột cũ màu be */}
              <div
                role="img"
                aria-label={`Chỉ số tập ${bars.length} buổi gần nhất: ${bars.map((s) => s.ChiSoTap).join(", ")}`}
                className="mt-5 flex items-end gap-1.5"
                style={{ height: BAR_AREA_HEIGHT }}
              >
                {bars.map((s, i) => (
                  <span
                    key={s.SessionID}
                    title={`${s.ChiSoTap}/100`}
                    className={`block w-2 ${i === bars.length - 1 ? "bg-brass" : "bg-sand"}`}
                    style={{ height: `${Math.max(4, (s.ChiSoTap / 100) * BAR_AREA_HEIGHT)}px` }}
                  />
                ))}
              </div>
            </div>
            {sideMetrics.map((metric) => (
              <div key={metric.label} className="border-t border-gridline py-3.5 md:border-t-0 md:border-l md:px-6">
                <p className="text-xs text-stone">{metric.label}</p>
                {/* Hàng số cao bằng số lớn (56px), số đặt sát đáy và nâng ~6px (chênh phần chân chữ 56px vs 26px)
                    để cùng baseline với số chỉ số tập; dòng phụ thẳng hàng với dòng chênh lệch bên trái */}
                <p className="mt-1 flex items-end md:h-14 md:pb-1.5">
                  <span className="font-serif text-[26px] leading-none font-semibold text-ink tabular-nums">
                    {metric.value} <span className="font-sans text-xs font-normal text-stone">{metric.unit}</span>
                  </span>
                </p>
                <p className="mt-2 text-xs text-stone">{metric.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <SessionCharts sessions={ascending} activeId={activeId} onActivate={setActiveId} />
          </div>

          <SessionLog sessions={sessions} activeId={activeId} onActivate={setActiveId} />
        </>
      )}
    </section>
  );
}
