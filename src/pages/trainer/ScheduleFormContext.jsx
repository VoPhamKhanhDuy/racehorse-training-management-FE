import HorseSummary from "./HorseSummary";
import TrainingLockNotice from "./TrainingLockNotice";
import { formatDate } from "../../utils/date";

// Cột ngữ cảnh của form lịch tập:
// - Khi chọn ngựa: thông tin ngựa + dải cảnh báo nếu đang khóa tập (form sẽ chặn xếp lịch).
// - Khi chọn nhân viên + ngày: các buổi nhân viên đó đã nhận trong ngày để tránh trùng giờ.
export default function ScheduleFormContext({
  horse,
  healthStatus,
  lock,
  lockedByName,
  groomName,
  date,
  groomDaySchedules,
  horseById,
  editingScheduleId,
}) {
  return (
    <div className="space-y-5">
      {horse ? (
        <>
          <HorseSummary horse={horse} healthStatus={healthStatus} />
          {lock && (
            <TrainingLockNotice lock={lock} lockedByName={lockedByName} hint="Ngựa đang bị khóa tập nên không thể xếp lịch." />
          )}
        </>
      ) : (
        <p className="text-sm text-stone">Chọn ngựa để xem thông tin sức khỏe và tình trạng khóa tập.</p>
      )}

      <section aria-label="Lịch của nhân viên trong ngày" className="border-t border-stone/15 pt-4">
        <h3 className="font-serif text-base font-semibold text-ink">
          {groomName && date ? `Lịch của ${groomName} ngày ${formatDate(date)}` : "Lịch của nhân viên trong ngày"}
        </h3>
        {!groomName || !date ? (
          <p className="mt-2 text-sm text-stone">Chọn nhân viên chăm sóc và ngày để xem các buổi đã nhận.</p>
        ) : groomDaySchedules.length === 0 ? (
          <p className="mt-2 text-sm text-stone">Chưa nhận buổi tập nào trong ngày này.</p>
        ) : (
          <ul className="mt-1">
            {groomDaySchedules.map((schedule) => (
              <li key={schedule.ScheduleID} className="border-b border-stone/15 py-2 text-sm last:border-b-0">
                <span className="font-semibold text-ink tabular-nums">{schedule.Gio}</span>
                <span className="text-stone"> · {horseById[schedule.HorseID]?.Ten ?? `Ngựa #${schedule.HorseID}`}</span>
                {schedule.ScheduleID === editingScheduleId && <span className="ml-1.5 text-xs text-brass-deep">(đang sửa)</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
