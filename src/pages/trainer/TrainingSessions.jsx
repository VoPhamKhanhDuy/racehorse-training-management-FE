import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import LoadingState from "../../components/LoadingState";
import SessionDrawer from "./SessionDrawer";
import SessionTable from "./SessionTable";
import { SESSION_QUERY_MAX_DAYS } from "../../data/trainingCodes";
import useApiResource from "../../hooks/useApiResource";
import useAuth from "../../hooks/useAuth";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { getAssignableStaff, getHorses, getTrainingPlans, searchTrainingSessions } from "../../services/trainingApi";
import { addDays, daysBetween, startOfWeek, todayISO } from "../../utils/date";
import { formatKm, formatNumber } from "../../utils/trainingFormat";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FILTER_SELECT =
  "w-full cursor-pointer rounded-md border border-stone/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brass";
const FILTER_LABEL = "mb-1 block text-xs font-medium text-stone";

// Khoảng ngày nhanh — tính theo hôm nay
const quickRanges = (today) => [
  { key: "week", label: "Tuần này", from: startOfWeek(today), to: addDays(startOfWeek(today), 6) },
  { key: "lastWeek", label: "Tuần trước", from: addDays(startOfWeek(today), -7), to: addDays(startOfWeek(today), -1) },
  { key: "next7", label: "7 ngày tới", from: today, to: addDays(today, 6) },
  { key: "last30", label: "30 ngày qua", from: addDays(today, -29), to: today },
];

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-stone">{label}</p>
      <p className="font-serif text-lg font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

// Tra cứu buổi tập theo khoảng ngày (tối đa 62 ngày) + lọc ngựa / giáo án / người phụ trách / trạng thái
// (GET /api/trainer/training-sessions). Bộ lọc nằm trên URL; bấm 1 dòng → ngăn chi tiết (bắt đầu, ghi kết quả, hủy...).
export default function TrainingSessions() {
  const { state } = useLocation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { options } = useTrainingOptions();
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

  // Danh sách cho bộ lọc — lỗi thì bộ lọc trống, lỗi chính hiện ở kết quả tra cứu
  const filterResource = useApiResource(() => Promise.all([getHorses(), getTrainingPlans(), getAssignableStaff()]), "filters");
  const [horses = [], plans = [], staffList = []] = filterResource.data ?? [];
  const staff = [...staffList].sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));

  const { horseId, planId, assignedToUserId, status } = filters;
  const query = { from, to, horseId, planId, assignedToUserId, status };
  // Khoảng ngày sai → không gọi API (key = null), chỉ báo lỗi
  const sessionsResource = useApiResource(() => searchTrainingSessions(query), rangeError ? null : JSON.stringify(query));
  const sessions = sessionsResource.data ?? [];
  const { loading, error } = sessionsResource;

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([name, value]) => {
      if (value) next.set(name, value);
      else next.delete(name);
    });
    setSearchParams(next, { replace: true });
  };

  const completed = sessions.filter((s) => s.status === "Completed");
  const scored = completed.filter((s) => s.performanceScore != null);
  const averageScore = scored.length ? scored.reduce((sum, s) => sum + Number(s.performanceScore), 0) / scored.length : null;
  const actualKm = completed.reduce((sum, s) => sum + Number(s.actualDistanceKm ?? 0), 0);
  const activeRange = quickRanges(today).find((r) => r.from === from && r.to === to)?.key;
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Buổi tập</h1>

      {message && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-sm border-l-2 border-green-700 bg-white/60 px-4 py-3 text-sm text-green-800">
          {message}
          <button type="button" onClick={() => setMessage("")} className="cursor-pointer font-semibold text-green-700 hover:underline">
            Đóng
          </button>
        </div>
      )}

      <section className="mb-5 space-y-4 rounded-lg border border-stone/15 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="sessionFrom" className={FILTER_LABEL}>
              Từ ngày
            </label>
            <input
              id="sessionFrom"
              type="date"
              value={from}
              onChange={(e) => e.target.value && updateParams({ from: e.target.value, to })}
              className="rounded-md border border-stone/25 bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-brass"
            />
          </div>
          <div>
            <label htmlFor="sessionTo" className={FILTER_LABEL}>
              Đến ngày
            </label>
            <input
              id="sessionTo"
              type="date"
              value={to}
              min={from}
              onChange={(e) => e.target.value && updateParams({ from, to: e.target.value })}
              className="rounded-md border border-stone/25 bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-brass"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickRanges(today).map((range) => (
              <button
                key={range.key}
                type="button"
                onClick={() => updateParams({ from: range.from, to: range.to })}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  activeRange === range.key
                    ? "border-brass bg-brass/15 font-medium text-brass-deep"
                    : "border-stone/25 bg-white text-ink hover:border-stone/40"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filterHorse" className={FILTER_LABEL}>
              Ngựa
            </label>
            <select id="filterHorse" value={horseId} onChange={(e) => updateParams({ horse: e.target.value })} className={FILTER_SELECT}>
              <option value="">Tất cả ngựa</option>
              {horses.map((horse) => (
                <option key={horse.horseId} value={horse.horseId}>
                  {horse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterPlan" className={FILTER_LABEL}>
              Giáo án
            </label>
            <select id="filterPlan" value={planId} onChange={(e) => updateParams({ plan: e.target.value })} className={FILTER_SELECT}>
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
          <div>
            <label htmlFor="filterStaff" className={FILTER_LABEL}>
              Người phụ trách
            </label>
            <select
              id="filterStaff"
              value={assignedToUserId}
              onChange={(e) => updateParams({ staff: e.target.value })}
              className={FILTER_SELECT}
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
          <div>
            <label htmlFor="filterStatus" className={FILTER_LABEL}>
              Trạng thái
            </label>
            <select id="filterStatus" value={status} onChange={(e) => updateParams({ status: e.target.value })} className={FILTER_SELECT}>
              <option value="">Tất cả trạng thái</option>
              {options.sessionStatuses.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => updateParams({ horse: "", plan: "", staff: "", status: "" })}
            className="cursor-pointer text-sm font-medium text-brass-deep underline-offset-2 hover:underline"
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-stone/15 bg-white px-5 py-4 sm:grid-cols-4">
            <SummaryItem label="Số buổi" value={sessions.length} />
            <SummaryItem label="Hoàn thành" value={completed.length} />
            <SummaryItem label="Điểm phong độ TB" value={averageScore != null ? formatNumber(averageScore) : "—"} />
            <SummaryItem label="Cự ly thực tế" value={formatKm(actualKm)} />
          </div>
          <SessionTable
            sessions={sessions}
            onSelect={setOpenSessionId}
            showHorse
            showPlan
            emptyText="Không có buổi tập nào trong khoảng ngày và bộ lọc đã chọn."
          />
        </div>
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
