import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import TrainingBadge from "../../components/TrainingBadge";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { generateWeeklySchedule, getAssignableStaff, getTrainingPlan } from "../../services/trainingApi";
import { addDays, formatDate, formatDayMonth, startOfWeek, todayISO, weekdayName } from "../../utils/date";
import { formatKm, formatMinutes } from "../../utils/trainingFormat";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const NAV_BUTTON =
  "flex h-[46px] w-10 cursor-pointer items-center justify-center rounded-md border border-stone/25 bg-white text-ink transition-colors hover:border-stone/40";
const TH = "px-3 py-2.5 text-xs font-medium text-stone whitespace-nowrap";
const TD = "px-3 py-2.5 align-top";

// Sinh lịch tập 1 tuần từ giai đoạn của giáo án (POST /api/trainer/training-plans/{id}/weekly-schedule).
// "Xem trước" không lưu (dùng được cả với giáo án Nháp); "Tạo lịch tuần" chỉ khi giáo án đang áp dụng.
// Chủ Nhật nghỉ, xen kẽ buổi nhẹ / buổi chính, ngày đã qua hoặc đã có lịch bị bỏ qua, thể trạng xấu đi thì tự hạ cường độ.
export default function WeeklyScheduleGenerator() {
  const { id } = useParams();
  const { label } = useTrainingOptions();
  const [plan, setPlan] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayISO()));
  // Ngày người dùng vừa chọn trong ô ngày (hiển thị đúng ngày đó); weekStart là thứ Hai của tuần chứa ngày này.
  // Tách riêng để ô không bị bẻ về thứ Hai ngay khi chọn/gõ (trước đây khiến không chọn được ngày khác).
  const [pickedDate, setPickedDate] = useState(() => startOfWeek(todayISO()));
  const [startTime, setStartTime] = useState("06:00");
  const [assignee, setAssignee] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [timeError, setTimeError] = useState("");
  const [running, setRunning] = useState(""); // "preview" | "create"
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([getTrainingPlan(id), getAssignableStaff()])
      .then(([planDetail, staffList]) => {
        if (ignore) return;
        setPlan(planDetail);
        setStaff(staffList);
        // Tuần mặc định: tuần hiện tại, hoặc tuần đầu của giáo án nếu giáo án chưa bắt đầu
        const today = todayISO();
        const initialWeek = startOfWeek(planDetail.startDate > today ? planDetail.startDate : today);
        setWeekStart(initialWeek);
        setPickedDate(initialWeek);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err);
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  const changeWeek = (value) => {
    if (!value) return;
    setPickedDate(value);
    setWeekStart(startOfWeek(value));
    setResult(null);
    setError(null);
  };

  const run = async (previewOnly) => {
    if (!TIME_PATTERN.test(startTime)) {
      setTimeError("Giờ bắt đầu dạng HH:mm");
      return;
    }
    setRunning(previewOnly ? "preview" : "create");
    setError(null);
    try {
      const data = await generateWeeklySchedule(plan.planId, {
        weekStartDate: weekStart,
        defaultStartTime: startTime,
        assignedToUserId: assignee ? Number(assignee) : null,
        replaceExisting,
        previewOnly,
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err);
    } finally {
      setRunning("");
    }
  };

  // Thử lại sau lỗi tải: hiện màn chờ ngay rồi gọi lại (effect phía trên chạy lại theo reloadKey)
  const retryLoad = () => {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  };

  if (loading) return <LoadingState />;
  if (loadError) return <ApiErrorNotice variant="page" error={loadError} onRetry={retryLoad} />;

  const isDraft = plan.status === "Draft";
  const canSchedule = plan.status === "Active";
  const canPreview = isDraft || canSchedule;
  const weekEnd = addDays(weekStart, 6);
  const outsidePlan = weekEnd < plan.startDate || weekStart > plan.endDate;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={`/trainer/plans/${plan.planId}`} className="text-sm font-medium text-brass-deep hover:underline">
        ← {plan.planName}
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isDraft ? "Xem trước lịch tuần" : "Xếp lịch tuần"}
      </h1>
      <p className="mt-1 text-sm text-stone">
        {plan.horseName} · giáo án {formatDate(plan.startDate)} – {formatDate(plan.endDate)} · {label("planStatuses", plan.status)}
      </p>

      {!canPreview ? (
        <p className="mt-6 rounded-sm border-l-2 border-stone/40 bg-white px-4 py-3 text-sm text-stone">
          Giáo án đã {label("planStatuses", plan.status).toLowerCase()} nên không xếp lịch được nữa.
        </p>
      ) : (
        <>
          {isDraft && (
            <p className="mt-4 rounded-sm border-l-2 border-brass bg-brass/5 px-4 py-3 text-sm text-ink">
              Giáo án đang ở trạng thái Nháp: chỉ xem trước được, chưa lưu buổi tập. Áp dụng giáo án ở trang chi tiết để tạo lịch thật.
            </p>
          )}

          <section className="mt-6 space-y-5 rounded-lg border border-stone/15 bg-white px-5 py-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => changeWeek(addDays(weekStart, -7))} aria-label="Tuần trước" className={NAV_BUTTON}>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="w-44">
                  <FormField
                    variant="outline"
                    label="Tuần (chọn 1 ngày bất kỳ)"
                    id="weekStart"
                    type="date"
                    value={pickedDate}
                    onChange={(e) => changeWeek(e.target.value)}
                  />
                </div>
                <button type="button" onClick={() => changeWeek(addDays(weekStart, 7))} aria-label="Tuần sau" className={NAV_BUTTON}>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="w-32">
                <FormField
                  variant="outline"
                  label="Giờ bắt đầu"
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setTimeError("");
                  }}
                  error={timeError}
                />
              </div>
              <div className="min-w-56 flex-1">
                <SelectField
                  variant="outline"
                  label="Phân công luôn cho"
                  id="assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                >
                  <option value="">Chưa phân công</option>
                  {staff.map((person) => (
                    <option key={person.userId} value={person.userId}>
                      {person.fullName}
                      {person.roleId === "head_trainer" ? " (HLV)" : ""}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            <p className="text-sm text-ink">
              Tuần <span className="font-semibold">Thứ Hai {formatDayMonth(weekStart)} – Chủ Nhật {formatDayMonth(weekEnd)}</span>
              {outsidePlan && <span className="ml-2 text-alert">(nằm ngoài thời gian giáo án)</span>}
            </p>

            {canSchedule && (
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-brass-deep)]"
                />
                <span>
                  Xếp lại lịch đã có trong tuần
                  <span className="block text-xs text-stone">
                    Xóa các buổi "Đã lên lịch" của giáo án trong tuần (từ hôm nay) rồi sinh lại. Buổi đang tập / đã xong giữ nguyên.
                  </span>
                </span>
              </label>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-stone/15 pt-4">
              <button
                type="button"
                onClick={() => run(true)}
                disabled={Boolean(running)}
                className="inline-flex h-10 cursor-pointer items-center rounded-sm border border-stone/25 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running === "preview" ? "Đang xem trước..." : "Xem trước"}
              </button>
              {canSchedule && (
                <button type="button" onClick={() => run(false)} disabled={Boolean(running)} className="btn-primary">
                  {running === "create" ? "Đang tạo..." : "Tạo lịch tuần"}
                </button>
              )}
            </div>
          </section>

          <div className="mt-6 space-y-4">
            <ApiErrorNotice error={error} />
            {result && <ScheduleResult result={result} label={label} planId={plan.planId} />}
          </div>
        </>
      )}
    </div>
  );
}

// Kết quả sinh lịch: danh sách buổi (sessionId = 0 khi xem trước), ngày bị bỏ qua, cảnh báo hạ cường độ
function ScheduleResult({ result, label, planId }) {
  const range = `${formatDayMonth(result.weekStartDate)} – ${formatDayMonth(result.weekEndDate)}`;
  return (
    <section className="space-y-4">
      {result.previewOnly ? (
        <h2 className="font-serif text-lg font-semibold text-ink">
          Xem trước tuần {range} <span className="font-sans text-sm font-normal text-stone">(chưa lưu)</span>
        </h2>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border-l-2 border-green-700 bg-white/60 px-4 py-3 text-sm text-green-800">
          <span>
            Đã tạo {result.createdCount} buổi tập cho tuần {range}
            {result.removedCount > 0 && `, xóa ${result.removedCount} buổi cũ`}.
          </span>
          <span className="flex gap-4">
            <Link to={`/trainer/schedule?week=${result.weekStartDate}`} className="font-semibold text-green-700 hover:underline">
              Xem lịch tập tuần →
            </Link>
            <Link to={`/trainer/plans/${planId}`} className="font-semibold text-green-700 hover:underline">
              Về giáo án →
            </Link>
          </span>
        </div>
      )}

      {result.warnings?.length > 0 && (
        <ul className="space-y-1.5 rounded-sm border-l-2 border-[#946330] bg-[#946330]/5 px-4 py-3 text-sm text-[#7a5228]">
          {result.warnings.map((warning) => (
            <li key={warning} className="flex gap-2">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {warning}
            </li>
          ))}
        </ul>
      )}

      {result.sessions.length === 0 ? (
        <p className="rounded-lg border border-stone/15 bg-white py-8 text-center text-sm text-stone">
          {result.previewOnly ? "Tuần này không có buổi nào được sinh." : "Không tạo thêm buổi nào."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone/15 bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-stone/15">
              <tr>
                <th className={TH}>Ngày</th>
                <th className={TH}>Buổi tập</th>
                <th className={TH}>Cường độ</th>
                <th className={`${TH} text-right`}>Cự ly · thời lượng</th>
                <th className={TH}>Mặt sân</th>
                <th className={TH}>Phụ trách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {result.sessions.map((session) => (
                <tr key={`${session.trainingDate}-${session.startTime}-${session.sessionId}`}>
                  <td className={`${TD} whitespace-nowrap`}>
                    <span className="font-medium text-ink">{weekdayName(session.trainingDate)}</span>
                    <span className="block text-xs text-stone tabular-nums">
                      {formatDate(session.trainingDate)} · {session.startTime}
                    </span>
                  </td>
                  <td className={TD}>
                    <p className="text-ink">{session.sessionTitle}</p>
                    <p className="text-xs text-stone">{label("trainingTypes", session.trainingType)}</p>
                  </td>
                  <td className={TD}>
                    <TrainingBadge kind="intensity" code={session.intensityLevel}>
                      {label("intensityLevels", session.intensityLevel)}
                    </TrainingBadge>
                  </td>
                  <td className={`${TD} text-right whitespace-nowrap tabular-nums`}>
                    {formatKm(session.distanceKm)} · {formatMinutes(session.durationMinutes)}
                  </td>
                  <td className={TD}>{label("surfaces", session.surface)}</td>
                  <td className={`${TD} whitespace-nowrap`}>{session.assignedToName ?? <span className="text-stone">Chưa phân công</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.skippedDays?.length > 0 && (
        <div className="rounded-lg border border-stone/15 bg-white px-5 py-4">
          <p className="text-sm font-semibold text-ink">Ngày không tạo buổi</p>
          <ul className="mt-2 space-y-1 text-sm text-stone">
            {result.skippedDays.map((day) => (
              <li key={day.date}>
                <span className="font-medium text-ink">
                  {weekdayName(day.date)} {formatDayMonth(day.date)}
                </span>{" "}
                — {day.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
