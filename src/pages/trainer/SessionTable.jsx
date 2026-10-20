import TrainingBadge from "../../components/TrainingBadge";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { formatDayMonth, shortWeekdayName, todayISO } from "../../utils/date";
import { formatKm, formatMinutes, formatNumber, formatTimeRange } from "../../utils/trainingFormat";

const TH = "px-3 py-2.5 text-xs font-medium text-stone whitespace-nowrap";
const TD = "px-3 py-2.5 align-top";

// Bảng buổi tập (TrainingSession) — bấm 1 dòng để mở ngăn chi tiết. showHorse / showPlan: thêm cột ngựa / giáo án.
export default function SessionTable({ sessions, onSelect, showHorse = false, showPlan = false, emptyText = "Không có buổi tập nào." }) {
  const { label } = useTrainingOptions();
  const today = todayISO();

  if (sessions.length === 0) {
    return <p className="rounded-lg border border-stone/15 bg-white py-10 text-center text-sm text-stone">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone/15 bg-white">
      <table className="w-full min-w-[52rem] text-left text-sm">
        <thead className="border-b border-stone/15">
          <tr>
            <th className={TH}>Ngày</th>
            {showHorse && <th className={TH}>Ngựa</th>}
            <th className={TH}>Buổi tập</th>
            <th className={TH}>Cường độ</th>
            <th className={`${TH} text-right`}>Kế hoạch</th>
            <th className={`${TH} text-right`}>Thực tế</th>
            <th className={`${TH} text-right`}>Điểm</th>
            <th className={TH}>Phụ trách</th>
            <th className={TH}>Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone/10">
          {sessions.map((session) => {
            const cancelled = session.status === "Cancelled";
            const isToday = session.trainingDate === today;
            return (
              <tr
                key={session.sessionId}
                onClick={() => onSelect(session.sessionId)}
                className={`cursor-pointer transition-colors hover:bg-brass/5 ${cancelled ? "text-stone" : ""} ${isToday ? "bg-brass/[0.03]" : ""}`}
              >
                <td className={`${TD} whitespace-nowrap`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(session.sessionId);
                    }}
                    className="cursor-pointer text-left font-medium text-ink outline-none focus-visible:underline"
                  >
                    {shortWeekdayName(session.trainingDate)} {formatDayMonth(session.trainingDate)}
                  </button>
                  <span className="block text-xs text-stone tabular-nums">
                    {isToday ? "Hôm nay · " : ""}
                    {formatTimeRange(session.startTime, session.endTime)}
                  </span>
                </td>
                {showHorse && <td className={`${TD} font-medium whitespace-nowrap`}>{session.horseName}</td>}
                <td className={TD}>
                  <p className={cancelled ? "line-through" : "text-ink"}>{session.sessionTitle}</p>
                  <p className="text-xs text-stone">
                    {label("trainingTypes", session.trainingType)}
                    {session.surface ? ` · ${label("surfaces", session.surface)}` : ""}
                    {showPlan && session.planName ? ` · ${session.planName}` : ""}
                  </p>
                </td>
                <td className={TD}>
                  <TrainingBadge kind="intensity" code={session.intensityLevel}>
                    {label("intensityLevels", session.intensityLevel)}
                  </TrainingBadge>
                </td>
                <td className={`${TD} text-right whitespace-nowrap tabular-nums`}>
                  {formatKm(session.distanceKm)}
                  <span className="block text-xs text-stone">{formatMinutes(session.durationMinutes)}</span>
                </td>
                <td className={`${TD} text-right whitespace-nowrap tabular-nums`}>
                  {session.status === "Completed" ? (
                    <>
                      {formatKm(session.actualDistanceKm)}
                      <span className="block text-xs text-stone">{formatMinutes(session.actualDurationMinutes)}</span>
                    </>
                  ) : (
                    <span className="text-stone">—</span>
                  )}
                </td>
                <td className={`${TD} text-right font-semibold tabular-nums`}>
                  {session.performanceScore != null ? formatNumber(session.performanceScore) : <span className="font-normal text-stone">—</span>}
                </td>
                <td className={`${TD} whitespace-nowrap`}>{session.assignedToName ?? <span className="text-stone">Chưa phân công</span>}</td>
                <td className={TD}>
                  <TrainingBadge kind="sessionStatus" code={session.status}>
                    {label("sessionStatuses", session.status)}
                  </TrainingBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
