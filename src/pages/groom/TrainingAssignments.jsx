import { useSearchParams } from "react-router-dom";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import LoadingState from "../../components/LoadingState";
import TrainingBadge from "../../components/TrainingBadge";
import useApiResource from "../../hooks/useApiResource";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { getMyTrainingAssignments } from "../../services/trainingApi";
import { addDays, formatDate, formatDayMonth, startOfWeek, todayISO, weekdayName } from "../../utils/date";
import { formatKm, formatMinutes, formatTimeRange } from "../../utils/trainingFormat";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NAV_BUTTON =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-stone/25 bg-white text-ink transition-colors hover:border-stone/40";

// Lịch tập được HLV phân công cho tôi (GET /api/training-assignments/me), xem theo tuần (?week=<Thứ Hai>).
// Không gồm buổi đã hủy. Nhân viên chăm sóc không gọi được API danh mục của HLV → nhãn lấy từ bản tĩnh.
export default function TrainingAssignments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { label } = useTrainingOptions({ remote: false });
  const today = todayISO();
  const currentWeekStart = startOfWeek(today);
  const weekParam = searchParams.get("week");
  const weekStart = weekParam && DATE_PATTERN.test(weekParam) ? startOfWeek(weekParam) : currentWeekStart;
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const resource = useApiResource(() => getMyTrainingAssignments({ from: weekStart, to: addDays(weekStart, 6) }), weekStart);
  const sessions = resource.data ?? [];
  const { loading, error } = resource;

  const goToWeek = (week) => setSearchParams(week === currentWeekStart ? {} : { week });
  const sessionsByDay = weekDays.map((date) => ({ date, items: sessions.filter((s) => s.trainingDate === date) }));
  const todayCount = sessions.filter((s) => s.trainingDate === today).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Lịch tập được giao</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => goToWeek(addDays(weekStart, -7))} aria-label="Tuần trước" className={NAV_BUTTON}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[7.5rem] text-center text-sm font-medium text-ink tabular-nums">
            {formatDayMonth(weekDays[0])} – {formatDayMonth(weekDays[6])}
          </span>
          <button type="button" onClick={() => goToWeek(addDays(weekStart, 7))} aria-label="Tuần sau" className={NAV_BUTTON}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          {weekStart !== currentWeekStart && (
            <button
              type="button"
              onClick={() => goToWeek(currentWeekStart)}
              className="ml-1 cursor-pointer text-sm font-medium text-brass-deep underline-offset-2 hover:underline"
            >
              Về tuần này
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ApiErrorNotice variant="page" error={error} onRetry={resource.reload} />
      ) : (
        <>
          <p className="mb-4 text-sm text-stone">
            {sessions.length === 0
              ? "Tuần này bạn chưa được phân công buổi tập nào."
              : `${sessions.length} buổi tập trong tuần${weekStart === currentWeekStart ? ` · hôm nay ${todayCount} buổi` : ""}.`}
          </p>
          <ol className="space-y-3">
            {sessionsByDay.map(({ date, items }) => {
              const isToday = date === today;
              return (
                <li
                  key={date}
                  className={`rounded-lg border bg-white px-4 py-3 sm:px-5 ${isToday ? "border-brass/60" : "border-stone/15"} ${
                    date < today ? "opacity-75" : ""
                  }`}
                >
                  <p className="flex items-baseline gap-2 text-sm">
                    <span className={`font-semibold ${isToday ? "text-brass-deep" : "text-ink"}`}>{weekdayName(date)}</span>
                    <span className="text-stone">{formatDate(date)}</span>
                    {isToday && <span className="rounded-sm bg-brass/15 px-1.5 py-px text-[11px] font-medium text-brass-deep">Hôm nay</span>}
                  </p>
                  {items.length === 0 ? (
                    <p className="mt-1 text-sm text-stone/70">Không có buổi tập.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-stone/10">
                      {items.map((session) => (
                        <li key={session.sessionId} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-2.5">
                          <div className="flex min-w-0 gap-3">
                            <span className="w-24 shrink-0 font-semibold text-ink tabular-nums">
                              {formatTimeRange(session.startTime, session.endTime)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-ink">
                                {session.horseName} <span className="font-normal text-stone">· {session.sessionTitle}</span>
                              </p>
                              <p className="text-xs text-stone">
                                {label("trainingTypes", session.trainingType)} · {label("surfaces", session.surface)} ·{" "}
                                {formatKm(session.distanceKm)} · {formatMinutes(session.durationMinutes)}
                              </p>
                              {session.notes && (
                                <p className="mt-1 flex gap-1.5 text-sm text-ink">
                                  <CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone" aria-hidden="true" />
                                  Dặn dò: {session.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TrainingBadge kind="intensity" code={session.intensityLevel}>
                              {label("intensityLevels", session.intensityLevel)}
                            </TrainingBadge>
                            <TrainingBadge kind="sessionStatus" code={session.status}>
                              {label("sessionStatuses", session.status)}
                            </TrainingBadge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
