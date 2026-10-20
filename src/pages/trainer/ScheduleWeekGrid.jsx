import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import HorseIcon from "../../components/HorseIcon";
import { chipClass } from "./sessionChipStyles";
import { formatDate, shortWeekdayName, weekdayName } from "../../utils/date";

// Viền ô: hairline rất nhạt (stone/10) — nhạt hơn viền chip để chip nổi lên trên lưới.
// Cột ngày đầu tiên không có viền trái vì cột dính đã có vạch ngăn bên phải (tránh viền đôi).
const CELL = "border-b border-stone/10 px-1.5 py-1.5 align-top";
const dayBorder = (index) => (index === 0 ? "" : "border-l border-l-stone/10");

// Lưới tuần kiểu bảng xếp ca: hàng = ngựa (mode "horse") hoặc người phụ trách (mode "staff"), cột = 7 ngày T2 → CN.
// rows: [{ key, kind, title, subtitle, photoUrl }]; sessionsByCell: "<row.key>|<ngày>" → buổi tập.
// chipText(session): chữ trên chip; addLink(row, date): link thêm buổi cho ô trống (null = không cho thêm).
export default function ScheduleWeekGrid({ rows, weekDays, today, sessionsByCell, chipText, chipTitle, onSelectSession, onSelectRow, addLink }) {
  const scrollRef = useRef(null);
  const weekKey = weekDays[0];

  // Màn hẹp (lưới cuộn ngang): tự cuộn để cột hôm nay nằm ngay sau cột đầu dính
  useEffect(() => {
    const container = scrollRef.current;
    const todayHeader = container?.querySelector("[data-today]");
    const firstHeader = container?.querySelector("th");
    if (!container || !todayHeader || !firstHeader) return;
    container.scrollLeft = Math.max(
      0,
      container.scrollLeft + todayHeader.getBoundingClientRect().left - firstHeader.getBoundingClientRect().right
    );
  }, [weekKey]);

  return (
    <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-stone/15 bg-white">
      {/* table-fixed: cột đầu rộng cố định, 7 cột ngày chia đều dù ô trống hay có lịch */}
      <table className="w-full min-w-[56rem] table-fixed border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-36 border-r border-b border-stone/15 bg-white px-3 py-2.5 text-xs font-medium text-stone sm:w-48">
              {rows[0]?.kind === "staff" ? "Người phụ trách" : "Ngựa"}
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
                  <span className={`block text-xs font-medium ${isPast ? "text-stone/60" : "text-stone"}`}>{shortWeekdayName(date)}</span>
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
              <th scope="row" className="sticky left-0 z-10 border-r border-b border-stone/10 border-r-stone/15 bg-white px-3 py-2 align-top font-normal">
                <button
                  type="button"
                  onClick={onSelectRow ? () => onSelectRow(row) : undefined}
                  disabled={!onSelectRow}
                  title={onSelectRow ? "Xem lịch 7 ngày + tổng kết tuần" : undefined}
                  className="flex w-full items-center gap-2 rounded-sm text-left enabled:cursor-pointer enabled:hover:text-brass-deep"
                >
                  {row.kind === "horse" ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone/10 text-stone">
                      {row.photoUrl ? (
                        <img src={row.photoUrl} alt="" className="h-full w-full object-cover object-[center_25%]" />
                      ) : (
                        <HorseIcon className="h-3.5 w-3.5" />
                      )}
                    </span>
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone/15 font-serif text-xs font-semibold text-stone">
                      {row.title.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-sm font-semibold">{row.title}</span>
                    <span className="block truncate text-[11px] text-stone">{row.subtitle}</span>
                  </span>
                </button>
              </th>

              {weekDays.map((date, index) => {
                const cellSessions = sessionsByCell[`${row.key}|${date}`] ?? [];
                const link = cellSessions.length === 0 && addLink ? addLink(row, date) : null;
                return (
                  <td key={date} className={`${CELL} ${dayBorder(index)} ${date === today ? "bg-brass/5" : ""}`}>
                    {cellSessions.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {cellSessions.map((session) => (
                          <button
                            key={session.sessionId}
                            type="button"
                            onClick={() => onSelectSession(session.sessionId)}
                            title={chipTitle(session)}
                            className={`cursor-pointer truncate rounded-sm px-1.5 py-0.5 text-left text-xs transition-colors ${chipClass(session.status)}`}
                          >
                            <span className="font-semibold tabular-nums">{session.startTime}</span> · {chipText(session)}
                          </button>
                        ))}
                      </div>
                    ) : link ? (
                      // Ô trống hôm nay/sắp tới: dấu "+" ẩn, chỉ hiện khi rê chuột hoặc focus bàn phím
                      <Link
                        to={link.to}
                        state={link.state}
                        aria-label={`Thêm buổi tập ${formatDate(date)} cho ${row.title}`}
                        className="flex h-full min-h-7 items-center justify-center rounded-sm text-stone/0 transition-colors hover:bg-brass/10 hover:text-brass-deep focus-visible:text-brass-deep"
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
