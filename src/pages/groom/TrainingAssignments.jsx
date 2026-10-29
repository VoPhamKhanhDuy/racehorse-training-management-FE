import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import LoadingState from "../../components/LoadingState";
import useApiResource from "../../hooks/useApiResource";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import TrainingSessionCard from "./TrainingSessionCard";
import { getMyTrainingAssignments } from "../../services/trainingApi";
import { addDays, formatDayMonth, startOfWeek, todayISO, weekdayName } from "../../utils/date";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NAV_BUTTON =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-[4px] border border-[#cfc4ad] bg-white text-[#2b2118] transition-colors hover:bg-[#f0efec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

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
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Lịch tập được giao</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToWeek(currentWeekStart)}
            className="mr-2 h-9 cursor-pointer rounded-[4px] border border-[#cfc4ad] bg-white px-4 text-sm font-semibold text-[#2b2118] transition-colors hover:bg-[#f0efec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
          >
            Hôm nay
          </button>
          <button type="button" onClick={() => goToWeek(addDays(weekStart, -7))} aria-label="Tuần trước" className={NAV_BUTTON}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[7.5rem] text-center text-[15px] font-semibold text-[#2b2118] tabular-nums">
            {formatDayMonth(weekDays[0])} – {formatDayMonth(weekDays[6])}
          </span>
          <button type="button" onClick={() => goToWeek(addDays(weekStart, 7))} aria-label="Tuần sau" className={NAV_BUTTON}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ApiErrorNotice variant="page" error={error} onRetry={resource.reload} />
      ) : (
        <>
          <p className="mt-1 mb-4 text-sm text-[#4a3f33]">
            {sessions.length === 0
              ? "Tuần này bạn chưa được phân công buổi tập nào."
              : `${sessions.length} buổi tập trong tuần${weekStart === currentWeekStart ? ` · hôm nay ${todayCount} buổi` : ""}.`}
          </p>
          {/* ≥768px: lưới 7 cột kiểu lịch; hẹp hơn: danh sách dọc, mỗi ngày một khối */}
          <ol className="overflow-hidden rounded-[4px] border border-[#b9ab90] bg-white md:grid md:grid-cols-7">
            {sessionsByDay.map(({ date, items }, index) => {
              const isToday = date === today;
              return (
                <li key={date} className={`min-w-0 border-b border-[#d9cfba] last:border-b-0 md:border-b-0 ${index > 0 ? "md:border-l" : ""}`}>
                  <div className="flex items-center gap-2.5 border-b border-[#b9ab90] bg-white px-3 py-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] font-serif text-xl leading-none font-semibold ${
                        isToday ? "bg-[#c2570c] text-white" : "text-[#2b2118]"
                      }`}
                    >
                      {date.slice(8, 10)}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${isToday ? "text-[#c2570c]" : "text-[#2b2118]"}`}>{weekdayName(date)}</p>
                      <p className="text-[13px] text-[#6b6055]">thg {Number(date.slice(5, 7))}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-2.5 md:min-h-[280px]">
                    {items.length === 0 ? (
                      <p aria-label="Không có buổi tập" className="text-center text-sm text-[#b9ab90]">
                        —
                      </p>
                    ) : (
                      items.map((session) => <TrainingSessionCard key={session.sessionId} session={session} label={label} />)
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
