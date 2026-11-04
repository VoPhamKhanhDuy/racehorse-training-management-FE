import ApiErrorNotice from "../../components/ApiErrorNotice";
import Drawer from "../../components/Drawer";
import TrainingBadge from "../../components/TrainingBadge";
import useApiResource from "../../hooks/useApiResource";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { getHorseWeeklySchedule } from "../../services/trainingApi";
import { formatDayMonth } from "../../utils/date";
import { formatKm, formatMinutes, formatNumber } from "../../utils/trainingFormat";

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-stone">{label}</p>
      <p className="font-serif text-lg font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

// Lịch 7 ngày (Thứ Hai → Chủ Nhật) của 1 ngựa + tổng kết tuần (GET /api/trainer/horses/{id}/weekly-schedule).
// horse = null → đóng. Bấm 1 buổi → onSelectSession (trang cha đóng ngăn này, mở ngăn chi tiết buổi tập).
export default function HorseWeekDrawer({ horse, weekStart, onClose, onSelectSession }) {
  const { label } = useTrainingOptions();
  const horseId = horse?.horseId;
  const { data: week, loading, error } = useApiResource(
    () => getHorseWeeklySchedule(horseId, weekStart),
    horseId ? `${horseId}|${weekStart}` : null
  );

  const summary = week?.summary;
  const header = (
    <div>
      <h2 className="font-serif text-lg font-semibold text-ink">{horse?.name}</h2>
      <p className="text-sm text-stone">
        Lịch tuần {week ? `${formatDayMonth(week.weekStartDate)} – ${formatDayMonth(week.weekEndDate)}` : ""}
      </p>
    </div>
  );

  return (
    <Drawer open={Boolean(horse)} label={`Lịch tuần của ${horse?.name ?? "ngựa"}`} header={header} onClose={onClose}>
      {loading && <p className="py-10 text-center text-sm text-stone">Đang tải lịch tuần...</p>}
      {error && (
        <div className="py-5">
          <ApiErrorNotice error={error} />
        </div>
      )}
      {week && (
        <div className="pb-5">
          <section className="grid grid-cols-3 gap-4 border-b border-stone/10 py-4">
            <SummaryItem label="Buổi tập" value={summary.totalSessions} />
            <SummaryItem label="Hoàn thành" value={summary.completedSessions} />
            <SummaryItem label="Đã hủy" value={summary.cancelledSessions} />
            <SummaryItem label="Cự ly kế hoạch" value={formatKm(summary.plannedDistanceKm)} />
            <SummaryItem label="Cự ly thực tế" value={formatKm(summary.actualDistanceKm)} />
            <SummaryItem label="Điểm TB" value={summary.averagePerformanceScore != null ? formatNumber(summary.averagePerformanceScore) : "—"} />
            <p className="col-span-3 text-xs text-stone">Thời lượng kế hoạch: {formatMinutes(summary.plannedDurationMinutes)} (không tính buổi đã hủy)</p>
          </section>

          <ol className="divide-y divide-stone/10">
            {week.days.map((day) => (
              <li key={day.date} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">
                    {day.dayOfWeek} <span className="font-normal text-stone">{formatDayMonth(day.date)}</span>
                  </p>
                  {day.isRestDay && <span className="text-xs text-stone">Nghỉ</span>}
                </div>
                {day.sessions.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {day.sessions.map((session) => (
                      <li key={session.sessionId}>
                        <button
                          type="button"
                          onClick={() => onSelectSession(session.sessionId)}
                          className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-sm border border-stone/15 px-3 py-2 text-left transition-colors hover:border-brass hover:bg-brass/5"
                        >
                          <span className="min-w-0">
                            <span className={`block text-sm ${session.status === "Cancelled" ? "text-stone line-through" : "text-ink"}`}>
                              <span className="font-semibold tabular-nums">{session.startTime}</span> · {session.sessionTitle}
                            </span>
                            <span className="block text-xs text-stone">
                              {label("trainingTypes", session.trainingType)} · {formatKm(session.distanceKm)} ·{" "}
                              {session.assignedToName ?? "Chưa phân công"}
                            </span>
                          </span>
                          <TrainingBadge kind="sessionStatus" code={session.status}>
                            {label("sessionStatuses", session.status)}
                          </TrainingBadge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Drawer>
  );
}
