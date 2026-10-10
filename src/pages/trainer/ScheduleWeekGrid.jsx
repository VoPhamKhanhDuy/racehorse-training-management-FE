import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import HorseIcon from "../../components/HorseIcon";
import { formatDate, weekdayName } from "../../utils/date";

const SHORT_WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const shortWeekday = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return SHORT_WEEKDAYS[new Date(year, month - 1, day).getDay()];
};
// Tên rút gọn trên chip: nhân viên lấy tên gọi (chữ cuối), ngựa giữ nguyên tên
const givenName = (fullName) => fullName.trim().split(/\s+/).pop();

// Viền ô: hairline rất nhạt (stone/10) — nhạt hơn viền chip để chip nổi lên trên lưới.
// Cột ngày đầu tiên không có viền trái vì cột dính đã có vạch ngăn bên phải (tránh viền đôi).
const CELL = "border-b border-stone/10 px-1.5 py-1.5 align-top";
const dayBorder = (index) => (index === 0 ? "" : "border-l border-l-stone/10");
// Nhãn khóa tập: chữ + viền hổ phách trầm (cùng màu nút Khóa ở /manager/staff)
const LOCK_LABEL = "rounded-sm border border-[#946330]/40 px-1 py-px text-[10px] font-medium text-[#946330] whitespace-nowrap";

// Lưới tuần kiểu bảng xếp ca: hàng = ngựa (mode "horse") hoặc nhân viên (mode "groom"), cột = 7 ngày T2 → CN.
// rows: [{ key, kind, entity, isLocked, count }]. Cột đầu dính trái; màn hẹp phần 7 ngày cuộn ngang.
export default function ScheduleWeekGrid({ mode, rows, weekDays, today, schedulesByCell, horseById, groomNameById }) {
  const scrollRef = useRef(null);
  const weekKey = weekDays[0];

  // Màn hẹp (lưới cuộn ngang): tự cuộn để cột hôm nay nằm ngay sau cột đầu dính
  useEffect(() => {
    const container = scrollRef.current;
    const todayHeader = container?.querySelector("[data-today]");
    const firstHeader = container?.querySelector("th");
    if (!container || !todayHeader || !firstHeader) return;
    // Đo theo vị trí thật trên màn hình (có tính viền ô) để mép trái cột hôm nay khớp mép phải cột dính
    container.scrollLeft = Math.max(
      0,
      container.scrollLeft + todayHeader.getBoundingClientRect().left - firstHeader.getBoundingClientRect().right
    );
  }, [weekKey, mode]);

  return (
    <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-stone/15 bg-white">
      {/* table-fixed: cột đầu rộng cố định, 7 cột ngày chia đều dù ô trống hay có lịch */}
      <table className="w-full min-w-[56rem] table-fixed border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-32 border-r border-b border-stone/15 bg-white px-3 py-2.5 text-xs font-medium text-stone sm:w-44">
              {mode === "horse" ? "Ngựa" : "Nhân viên chăm sóc"}
            </th>
            {weekDays.map((date, index) => {
              const isToday = date === today;
              const isPast = date < today;
              return (
                <th
                  key={date}
                  data-today={isToday || undefined}
                  title={`${weekdayName(date)}, ${formatDate(date)}`}
                  className={`border-b border-stone/15 px-2 py-2 text-center font-normal ${dayBorder(index)} ${
                    isToday ? "border-t-2 border-t-brass bg-brass/5" : ""
                  }`}
                >
                  <span className={`block text-xs font-medium ${isPast ? "text-stone/60" : "text-stone"}`}>{shortWeekday(date)}</span>
                  <span
                    className={`inline-flex items-center gap-1 font-serif text-base font-semibold ${
                      isPast ? "text-stone/60" : isToday ? "text-brass-deep" : "text-ink"
                    }`}
                  >
                    {date.slice(8, 10)}
                    {isToday && <span aria-label="Hôm nay" className="h-1.5 w-1.5 rounded-full bg-brass" />}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {/* Cột đầu: đối tượng của hàng + số buổi trong tuần */}
              <th
                scope="row"
                className={`sticky left-0 z-10 border-r border-b border-stone/10 border-r-stone/15 px-3 py-2 align-top font-normal ${
                  // Cột dính cần nền đặc: hàng khóa tập dùng stone pha 5% trên nền trắng (cùng tông bg-stone/5 của các ô)
                  row.isLocked ? "bg-[color-mix(in_srgb,var(--color-stone)_5%,white)]" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  {row.kind === "horse" ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone/10 text-stone">
                      {row.entity.photo ? (
                        <img src={row.entity.photo} alt="" className="h-full w-full object-cover object-[center_25%]" />
                      ) : (
                        <HorseIcon className="h-3.5 w-3.5" />
                      )}
                    </span>
                  ) : (
                    // Avatar chữ cái, cùng kiểu trung tính ở bảng nhân sự
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone/15 font-serif text-xs font-semibold text-stone">
                      {row.entity.HoTen.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-serif text-sm font-semibold text-ink">
                      {row.kind === "horse" ? row.entity.Ten : row.entity.HoTen}
                    </p>
                    <p className="flex flex-wrap items-center gap-1 text-[11px] text-stone">
                      {row.count ? `${row.count} buổi` : "Chưa có buổi"}
                      {row.isLocked && <span className={LOCK_LABEL}>Đang khóa tập</span>}
                    </p>
                  </div>
                </div>
              </th>

              {weekDays.map((date, index) => {
                const isPast = date < today;
                const cellSchedules = schedulesByCell[`${row.key}|${date}`] ?? [];
                const canAdd = !isPast && !row.isLocked;
                const prefill = new URLSearchParams({ date, [row.kind]: row.kind === "horse" ? row.entity.HorseID : row.entity.UserID });
                return (
                  <td
                    key={date}
                    className={`${CELL} ${dayBorder(index)} ${date === today ? "bg-brass/5" : ""} ${row.isLocked ? "bg-stone/5" : ""}`}
                  >
                    {cellSchedules.length > 0 ? (
                      <div className={`flex flex-col gap-1 ${row.isLocked ? "opacity-60" : ""}`}>
                        {cellSchedules.map((s) => {
                          const otherName =
                            mode === "horse"
                              ? givenName(groomNameById[s.GroomID] ?? `#${s.GroomID}`)
                              : horseById[s.HorseID]?.Ten ?? `#${s.HorseID}`;
                          const detail = `${s.Gio} ${weekdayName(s.Ngay)} ${formatDate(s.Ngay)} · ${
                            horseById[s.HorseID]?.Ten ?? "Ngựa"
                          } · ${groomNameById[s.GroomID] ?? "Nhân viên"}`;
                          const label = (
                            <>
                              <span className="font-semibold tabular-nums">{s.Gio}</span> · {otherName}
                            </>
                          );
                          // Buổi đã qua: chỉ xem (tooltip chi tiết), không mở form sửa
                          return isPast ? (
                            <span key={s.ScheduleID} title={`Đã qua — ${detail}`} className="truncate rounded-sm bg-stone/10 px-1.5 py-0.5 text-xs text-stone">
                              {label}
                            </span>
                          ) : (
                            <Link
                              key={s.ScheduleID}
                              to={`/trainer/schedule/${s.ScheduleID}/edit`}
                              title={`Sửa buổi tập — ${detail}`}
                              className="truncate rounded-sm border border-brass/50 bg-white px-1.5 py-0.5 text-xs text-ink transition-colors hover:border-brass hover:bg-brass/10"
                            >
                              {label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : canAdd ? (
                      // Ô trống hôm nay/sắp tới: dấu "+" ẩn (trong suốt), chỉ hiện khi rê chuột hoặc focus bàn phím; bấm mở form điền sẵn
                      <Link
                        to={`/trainer/schedule/new?${prefill}`}
                        aria-label={`Xếp lịch ${formatDate(date)} cho ${row.kind === "horse" ? row.entity.Ten : row.entity.HoTen}`}
                        className="group flex h-full min-h-7 items-center justify-center rounded-sm text-stone/0 transition-colors hover:bg-brass/10 hover:text-brass-deep focus-visible:text-brass-deep"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="block min-h-7" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
