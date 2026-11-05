import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import LoadingState from "../../components/LoadingState";
import SessionDrawer from "./SessionDrawer";
import SessionReviewDialog from "./SessionReviewDialog";
import SessionTable from "./SessionTable";
import { SESSION_QUERY_MAX_DAYS } from "../../data/trainingCodes";
import useApiResource from "../../hooks/useApiResource";
import useAuth from "../../hooks/useAuth";
import useSessionReviews from "../../hooks/useSessionReviews";
import { getDemoSessions } from "../../data/demoTrainingSessions";
import { STAGES, actualDistanceOf, isCompletedSession, scoreOf, sessionStage } from "../../utils/sessionReview";
import { getAssignableStaff, getHorses, getTrainingPlans, searchTrainingSessions } from "../../services/trainingApi";
import { addDays, daysBetween, startOfWeek, todayISO } from "../../utils/date";
import { formatKm, formatNumber } from "../../utils/trainingFormat";
import DateInput from "../../components/DateInput";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Thanh lọc 1 hàng: ô cao 36px, bo 4px, viền #cfc4ad; nhãn nhỏ 12px (cao 16px) ngay trên ô
const FILTER_CONTROL =
  "h-9 w-full cursor-pointer rounded border border-[#cfc4ad] bg-white px-2.5 text-sm text-[#2b2118] outline-none focus:border-[#c2570c]";
const FILTER_LABEL = "mb-0.5 block text-xs leading-4 text-[#6b6055]";

// Khoảng ngày nhanh — tính theo hôm nay
const quickRanges = (today) => [
  { key: "week", label: "Tuần này", from: startOfWeek(today), to: addDays(startOfWeek(today), 6) },
  { key: "lastWeek", label: "Tuần trước", from: addDays(startOfWeek(today), -7), to: addDays(startOfWeek(today), -1) },
  { key: "next7", label: "7 ngày tới", from: today, to: addDays(today, 6) },
  { key: "last30", label: "30 ngày qua", from: addDays(today, -29), to: today },
];

// Tra cứu buổi tập theo khoảng ngày (tối đa 62 ngày) + lọc ngựa / giáo án / người phụ trách / trạng thái
// (GET /api/trainer/training-sessions). Bộ lọc nằm trên URL; bấm 1 dòng → ngăn chi tiết (bắt đầu, ghi kết quả, hủy...).
export default function TrainingSessions() {
  const { state } = useLocation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayISO();
  const defaultRange = quickRanges(today)[0];

  const param = (name) => searchParams.get(name) ?? "";
  const from = DATE_PATTERN.test(param("from")) ? param("from") : defaultRange.from;
  const to = DATE_PATTERN.test(param("to")) ? param("to") : defaultRange.to;
  const filters = {
    horseId: param("horse"),
    planId: param("plan"),
    assignedToUserId: param("staff"),
    status: param("status"),
  };
  const rangeError =
    to < from
      ? "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu."
      : daysBetween(from, to) + 1 > SESSION_QUERY_MAX_DAYS
        ? `Mỗi lần tra cứu tối đa ${SESSION_QUERY_MAX_DAYS} ngày.`
        : "";

  const [message, setMessage] = useState(state?.message ?? "");
  const [openSessionId, setOpenSessionId] = useState(null);
  const [reviewSessionId, setReviewSessionId] = useState(null); // buổi đang mở khung "Đánh giá buổi tập"
  const records = useSessionReviews(); // báo cáo của Groom + đánh giá của Trainer (MOCK)

  // Danh sách cho bộ lọc — lỗi thì bộ lọc trống, lỗi chính hiện ở kết quả tra cứu
  const filterResource = useApiResource(() => Promise.all([getHorses(), getTrainingPlans(), getAssignableStaff()]), "filters");
  const [horses = [], plans = [], staffList = []] = filterResource.data ?? [];
  const staff = [...staffList].sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));

  const { horseId, planId, assignedToUserId, status } = filters;
  const query = { from, to, horseId, planId, assignedToUserId }; // "status" lọc phía FE theo 4 tình trạng (STAGES)
  // Khoảng ngày sai → không gọi API (key = null), chỉ báo lỗi
  const sessionsResource = useApiResource(() => searchTrainingSessions(query), rangeError ? null : JSON.stringify(query));
  // Buổi đã hủy không hiện trong danh sách (chỉ hiện khi chủ động lọc trạng thái "Đã hủy")
  // Buổi mẫu đã qua (data/demoTrainingSessions.js — MOCK chờ dữ liệu thật) trộn vào khi khớp khoảng ngày và bộ lọc; sắp theo ngày giờ như API
  const demoSessions = sessionsResource.data
    ? getDemoSessions().filter((s) => s.trainingDate >= from && s.trainingDate <= to && !horseId && !planId && !assignedToUserId)
    : [];
  const sessions = [...(sessionsResource.data ?? []), ...demoSessions]
    .filter((s) => s.status !== "Cancelled" && (!status || sessionStage(s, records[s.sessionId]) === status))
    .sort((a, b) => `${a.trainingDate} ${a.startTime}`.localeCompare(`${b.trainingDate} ${b.startTime}`));
  const { loading, error } = sessionsResource;

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([name, value]) => {
      if (value) next.set(name, value);
      else next.delete(name);
    });
    setSearchParams(next, { replace: true });
  };

  // Dòng tóm tắt chỉ tính buổi đã có báo cáo / đánh giá hợp lệ (đã đến giờ + có bản ghi); buổi chưa diễn ra hoặc chưa báo cáo không tính
  // Hoàn thành / điểm / km thực tế tính theo báo cáo của Groom và đánh giá của Trainer, không có thì theo dữ liệu BE
  const reportedSessions = sessions.filter((s) => ["AwaitingReview", "Reviewed"].includes(sessionStage(s, records[s.sessionId])));
  const completed = reportedSessions.filter((s) => isCompletedSession(s, records[s.sessionId]));
  const scoredValues = reportedSessions.map((s) => scoreOf(s, records[s.sessionId])).filter((v) => v != null);
  const averageScore = scoredValues.length ? scoredValues.reduce((sum, v) => sum + Number(v), 0) / scoredValues.length : null;
  const actualKm = completed.reduce((sum, s) => sum + Number(actualDistanceOf(s, records[s.sessionId]) ?? 0), 0);

  // Bấm "Xem" → khung chi tiết theo tình trạng buổi (chưa diễn ra / chờ báo cáo / chờ đánh giá / đã đánh giá).
  // Buổi đang tập (đã bắt đầu qua BE) vẫn mở ngăn thao tác cũ để ghi kết quả.
  const handleSelect = (sessionId) => {
    const target = sessions.find((s) => s.sessionId === sessionId);
    if (target?.status === "InProgress") setOpenSessionId(sessionId);
    else setReviewSessionId(sessionId);
  };
  const reviewSession = sessions.find((s) => s.sessionId === reviewSessionId) ?? null;
  const activeRange = quickRanges(today).find((r) => r.from === from && r.to === to)?.key;
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <h1 className="mb-4 font-serif text-2xl font-semibold tracking-tight text-[#2b2118] sm:text-[1.75rem]">Buổi tập</h1>

      {message && (
        <div className="mb-4 flex min-h-11 items-center justify-between gap-4 rounded-sm border border-[#cfd8b4] border-l-[3px] border-l-[#6b7a3a] bg-[#f6f8ee] px-4 py-2 text-sm text-[#3f5420]">
          {message}
          <button type="button" onClick={() => setMessage("")} className="cursor-pointer font-medium text-[#3f5420] hover:underline">
            Đóng
          </button>
        </div>
      )}

      {/* Thanh lọc 1 hàng (xuống hàng khi thiếu chỗ), không khung thẻ; đường kẻ hairline bên dưới */}
      <section className="flex flex-wrap items-end gap-x-3 gap-y-2 border-b border-[#d9cfba] pb-3">
        <div className="w-full sm:w-36">
          <label htmlFor="sessionFrom" className={FILTER_LABEL}>
            Từ ngày
          </label>
          <DateInput
            required
            id="sessionFrom"
            value={from}
            onChange={(e) => e.target.value && updateParams({ from: e.target.value, to })}
            className={FILTER_CONTROL}
          />
        </div>
        <div className="w-full sm:w-36">
          <label htmlFor="sessionTo" className={FILTER_LABEL}>
            Đến ngày
          </label>
          <DateInput
            required
            id="sessionTo"
            value={to}
            min={from}
            onChange={(e) => e.target.value && updateParams({ from, to: e.target.value })}
            className={FILTER_CONTROL}
          />
        </div>
        {/* Khoảng thời gian: select thay cho các nút nhanh; chọn 1 mục gọi đúng updateParams({ from, to }) như nút cũ.
            "Tùy chọn" chỉ hiện khi 2 ngày đang không trùng khoảng nhanh nào */}
        <div className="w-full sm:w-36">
          <label htmlFor="filterRange" className={FILTER_LABEL}>
            Khoảng thời gian
          </label>
          <select
            id="filterRange"
            value={activeRange ?? "custom"}
            onChange={(e) => {
              const range = quickRanges(today).find((r) => r.key === e.target.value);
              if (range) updateParams({ from: range.from, to: range.to });
            }}
            className={FILTER_CONTROL}
          >
            {!activeRange && <option value="custom">Tùy chọn</option>}
            {quickRanges(today).map((range) => (
              <option key={range.key} value={range.key}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label htmlFor="filterHorse" className={FILTER_LABEL}>
            Ngựa
          </label>
          <select id="filterHorse" value={horseId} onChange={(e) => updateParams({ horse: e.target.value })} className={FILTER_CONTROL}>
            <option value="">Tất cả ngựa</option>
            {horses.map((horse) => (
              <option key={horse.horseId} value={horse.horseId}>
                {horse.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-52">
          <label htmlFor="filterPlan" className={FILTER_LABEL}>
            Giáo án
          </label>
          <select id="filterPlan" value={planId} onChange={(e) => updateParams({ plan: e.target.value })} className={FILTER_CONTROL}>
            <option value="">Tất cả giáo án</option>
            {plans
              .filter((p) => !horseId || String(p.horseId) === horseId || String(p.planId) === planId)
              .map((plan) => (
                <option key={plan.planId} value={plan.planId}>
                  {plan.planName} — {plan.horseName}
                </option>
              ))}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label htmlFor="filterStaff" className={FILTER_LABEL}>
            Người phụ trách
          </label>
          <select
            id="filterStaff"
            value={assignedToUserId}
            onChange={(e) => updateParams({ staff: e.target.value })}
            className={FILTER_CONTROL}
          >
            <option value="">Tất cả</option>
            {staff.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.fullName}
                {person.userId === user.apiUserId ? " (tôi)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label htmlFor="filterStatus" className={FILTER_LABEL}>
            Trạng thái
          </label>
          <select id="filterStatus" value={status} onChange={(e) => updateParams({ status: e.target.value })} className={FILTER_CONTROL}>
            <option value="">Tất cả trạng thái</option>
            {STAGES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => updateParams({ horse: "", plan: "", staff: "", status: "" })}
            className="h-9 cursor-pointer text-sm font-medium text-[#c2570c] underline-offset-2 hover:underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </section>

      {rangeError ? (
        <p className="rounded-sm border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert">{rangeError}</p>
      ) : loading ? (
        <LoadingState />
      ) : error ? (
        <ApiErrorNotice variant="page" error={error} onRetry={sessionsResource.reload} />
      ) : (
        <div>
          {/* Dòng tóm tắt (thay dải 4 số liệu): dùng đúng các giá trị đang tính */}
          {reportedSessions.length > 0 && (
            <p className="mt-3 mb-3 text-sm text-[#6b6055]">
              <b className="font-semibold text-[#2b2118]">{reportedSessions.length}</b> buổi ·{" "}
              <b className="font-semibold text-[#2b2118]">{completed.length}</b> hoàn thành
              {averageScore != null && (
                <>
                  {" "}
                  · Điểm phong độ TB <b className="font-semibold text-[#2b2118]">{formatNumber(averageScore)}</b>
                </>
              )}
              {actualKm > 0 && (
                <>
                  {" "}
                  · <b className="font-semibold text-[#2b2118]">{formatKm(actualKm)}</b> thực tế
                </>
              )}
            </p>
          )}
          {reportedSessions.length === 0 && <div className="mt-3" />}
          <SessionTable
            sessions={sessions}
            onSelect={handleSelect}
            showHorse
            emptyText="Không có buổi tập nào trong khoảng ngày và bộ lọc đã chọn."
          />
        </div>
      )}

      {reviewSession && (
        <SessionReviewDialog
          key={reviewSession.sessionId}
          session={reviewSession}
          record={records[reviewSession.sessionId]}
          onClose={() => setReviewSessionId(null)}
          onSaved={(text) => {
            setReviewSessionId(null);
            setMessage(text);
          }}
        />
      )}

      <SessionDrawer
        key={openSessionId ?? "closed"}
        sessionId={openSessionId}
        onClose={() => setOpenSessionId(null)}
        onChanged={sessionsResource.refresh}
      />
    </div>
  );
}
