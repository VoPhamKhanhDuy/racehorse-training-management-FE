import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import LoadingState from "../../components/LoadingState";
import TabFilter from "../../components/TabFilter";
import HorseWeekDrawer from "./HorseWeekDrawer";
import ScheduleWeekGrid from "./ScheduleWeekGrid";
import SessionDrawer from "./SessionDrawer";
import { CHIP_STATUSES, swatchClass } from "./sessionChipStyles";
import useApiResource from "../../hooks/useApiResource";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { getAssignableStaff, getHorses, getTrainingPlans, searchTrainingSessions } from "../../services/trainingApi";
import { addDays, formatDate, formatDayMonth, startOfWeek, todayISO, weekdayName } from "../../utils/date";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NAV_BUTTON =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-[#cfc4ad] bg-white text-[#2b2118] transition-colors hover:bg-[#f0efec]";
const VIEW_MODES = [
  { code: "horse", label: "Theo ngựa" },
  { code: "staff", label: "Theo người phụ trách" },
];
const UNASSIGNED_KEY = "staff-none";
// Tên rút gọn trên chip: người phụ trách lấy tên gọi (chữ cuối)
const givenName = (fullName) => (fullName ?? "").trim().split(/\s+/).pop();

// Lịch tập dạng lưới tuần: hàng = ngựa hoặc người phụ trách, cột = T2 → CN.
// Dữ liệu: GET /api/trainer/training-sessions?from=<Thứ Hai>&to=<Chủ Nhật>. Bấm chip → chi tiết buổi tập (bắt đầu, phân công,
// hủy...); bấm tên ngựa → lịch 7 ngày + tổng kết tuần của ngựa đó; ô trống của ngựa có giáo án đang áp dụng → thêm buổi.
// Tuần (?week=<Thứ Hai>) và chế độ xem (?view=staff) nằm trên URL để quay lại từ form vẫn đúng.
export default function Schedule() {
  const { state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { label } = useTrainingOptions();
  const today = todayISO();
  const currentWeekStart = startOfWeek(today);
  const weekParam = searchParams.get("week");
  const weekStart = weekParam && DATE_PATTERN.test(weekParam) ? startOfWeek(weekParam) : currentWeekStart;
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6];
  const mode = searchParams.get("view") === "staff" ? "staff" : "horse";

  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState(state?.message ?? "");
  const [openSessionId, setOpenSessionId] = useState(null);
  const [weekHorse, setWeekHorse] = useState(null); // ngựa đang xem lịch 7 ngày

  // Ngựa, người phụ trách, giáo án đang áp dụng: nạp 1 lần; buổi tập: theo tuần đang xem
  const baseResource = useApiResource(
    () => Promise.all([getHorses(), getAssignableStaff(), getTrainingPlans({ status: "Active" })]),
    "base"
  );
  const sessionsResource = useApiResource(() => searchTrainingSessions({ from: weekStart, to: weekEnd }), weekStart);
  const [horses = [], staffList = [], activePlans = []] = baseResource.data ?? [];
  const staff = [...staffList].sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));
  const sessions = sessionsResource.data ?? [];
  const error = baseResource.error ?? sessionsResource.error;
  const loading = baseResource.loading || sessionsResource.loading;

  const updateParams = (changes) => {
    const next = { week: weekStart, view: mode, ...changes };
    const params = {};
    if (next.week !== currentWeekStart) params.week = next.week;
    if (next.view === "staff") params.view = "staff";
    setSearchParams(params);
  };

  const retry = () => {
    if (baseResource.error) baseResource.reload();
    if (sessionsResource.error) sessionsResource.reload();
  };

  const normalizedKeyword = keyword.trim().toLowerCase();
  const weekSessions = sessions.filter((s) => (s.horseName ?? "").toLowerCase().includes(normalizedKeyword));
  const activeCount = (list) => list.filter((s) => s.status !== "Cancelled").length;
  const countLabel = (list) => (activeCount(list) ? `${activeCount(list)} buổi` : "Chưa có buổi");

  // Giáo án đang áp dụng của từng ngựa → ô trống trong khoảng giáo án được thêm buổi
  const activePlanByHorse = Object.fromEntries(activePlans.map((p) => [p.horseId, p]));

  let rows;
  let rowKeyOf;
  if (mode === "horse") {
    rowKeyOf = (s) => `horse-${s.horseId}`;
    rows = horses
      .filter((h) => h.name.toLowerCase().includes(normalizedKeyword))
      .map((h) => {
        const plan = activePlanByHorse[h.horseId];
        const horseSessions = weekSessions.filter((s) => s.horseId === h.horseId);
        return {
          key: `horse-${h.horseId}`,
          kind: "horse",
          horse: h,
          title: h.name,
          photoUrl: h.photoUrl,
          subtitle: `${countLabel(horseSessions)}${plan ? "" : " · chưa có giáo án áp dụng"}`,
        };
      });
  } else {
    rowKeyOf = (s) => (s.assignedToUserId ? `staff-${s.assignedToUserId}` : UNASSIGNED_KEY);
    // Người phụ trách hợp lệ + người có buổi trong tuần nhưng không còn trong danh sách (vd tài khoản bị khóa)
    const people = new Map(staff.map((p) => [p.userId, p.fullName]));
    weekSessions.forEach((s) => {
      if (s.assignedToUserId && !people.has(s.assignedToUserId)) people.set(s.assignedToUserId, s.assignedToName ?? `#${s.assignedToUserId}`);
    });
    rows = [...people.entries()].map(([userId, fullName]) => ({
      key: `staff-${userId}`,
      kind: "staff",
      title: fullName,
      subtitle: countLabel(weekSessions.filter((s) => s.assignedToUserId === userId)),
    }));
    const unassigned = weekSessions.filter((s) => !s.assignedToUserId);
    if (unassigned.length > 0) rows.unshift({ key: UNASSIGNED_KEY, kind: "staff", title: "Chưa phân công", subtitle: countLabel(unassigned) });
  }

  const sessionsByCell = weekSessions.reduce((acc, s) => {
    const key = `${rowKeyOf(s)}|${s.trainingDate}`;
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  const chipText = (s) => (mode === "horse" ? label("trainingTypes", s.trainingType) : s.horseName);
  const chipTitle = (s) =>
    `${label("sessionStatuses", s.status)} — ${s.sessionTitle} · ${s.horseName} · ${weekdayName(s.trainingDate)} ${formatDate(
      s.trainingDate
    )} ${s.startTime} · ${s.assignedToName ? givenName(s.assignedToName) : "chưa phân công"}`;

  // Ô trống từ hôm nay, trong khoảng ngày của giáo án đang áp dụng → mở form thêm buổi điền sẵn ngày
  const addLink = (row, date) => {
    if (row.kind !== "horse" || date < today) return null;
    const plan = activePlanByHorse[row.horse.horseId];
    if (!plan || date < plan.startDate || date > plan.endDate) return null;
    const from = `/trainer/schedule${weekStart !== currentWeekStart ? `?week=${weekStart}` : ""}`;
    return { to: `/trainer/plans/${plan.planId}/sessions/new?date=${date}`, state: { from } };
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Lịch tập</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => updateParams({ week: addDays(weekStart, -7) })} aria-label="Tuần trước" className={NAV_BUTTON}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[7.5rem] text-center text-sm font-medium text-ink tabular-nums">
            {formatDayMonth(weekStart)} – {formatDayMonth(weekEnd)}
          </span>
          <button type="button" onClick={() => updateParams({ week: addDays(weekStart, 7) })} aria-label="Tuần sau" className={NAV_BUTTON}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          {weekStart !== currentWeekStart && (
            <button
              type="button"
              onClick={() => updateParams({ week: currentWeekStart })}
              className="ml-1 cursor-pointer text-sm font-medium text-brass-deep underline-offset-2 hover:underline"
            >
              Về tuần này
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-4 flex min-h-11 items-center justify-between gap-4 rounded-sm border border-[#cfd8b4] border-l-[3px] border-l-[#6b7a3a] bg-[#f6f8ee] px-4 py-2 text-sm text-[#3f5420]">
          {message}
          <button type="button" onClick={() => setMessage("")} className="cursor-pointer font-medium text-[#3f5420] hover:underline">
            Đóng
          </button>
        </div>
      )}

      {error ? (
        <ApiErrorNotice variant="page" error={error} onRetry={retry} />
      ) : loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          {/* 1 hàng: tab chế độ xem bên trái, tìm kiếm bên phải; đường kẻ chạy hết chiều rộng bên dưới cả hàng */}
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[#ece5d6]">
            <TabFilter ariaLabel="Chế độ xem" options={VIEW_MODES} value={mode} onChange={(code) => updateParams({ view: code })} />
            <div className="relative w-full pb-2 sm:w-64">
              <label htmlFor="scheduleKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-[18px] left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" />
              <input
                id="scheduleKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded border border-[#cfc4ad] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none transition-colors placeholder:text-[#6b6055]/60 focus:border-[#c2570c]"
              />
            </div>
          </div>

          {/* Chú giải màu thẻ — ô vuông đặc cùng màu vạch trái của thẻ trong lưới */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#4a3f33]">
            {CHIP_STATUSES.map((status) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-[2px] ${swatchClass(status)}`} aria-hidden="true" />
                {label("sessionStatuses", status)}
              </span>
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="rounded border border-[#b9ab90] bg-white py-16 text-center text-[#6b6055]">
              <SearchX className="mx-auto mb-3 h-10 w-10 text-[#6b6055]/40" />
              {mode === "horse" ? "Không tìm thấy ngựa phù hợp" : "Tuần này chưa có buổi tập nào"}
            </div>
          ) : (
            <ScheduleWeekGrid
              rows={rows}
              weekDays={weekDays}
              today={today}
              sessionsByCell={sessionsByCell}
              chipText={chipText}
              chipTitle={chipTitle}
              onSelectSession={setOpenSessionId}
              onSelectRow={mode === "horse" ? (row) => setWeekHorse(row.horse) : undefined}
              addLink={addLink}
            />
          )}
        </div>
      )}

      <HorseWeekDrawer
        horse={weekHorse}
        weekStart={weekStart}
        onClose={() => setWeekHorse(null)}
        onSelectSession={(sessionId) => {
          setWeekHorse(null);
          setOpenSessionId(sessionId);
        }}
      />
      {/* Sau thao tác trong ngăn chi tiết: tải lại ngầm tuần đang xem */}
      <SessionDrawer
        key={openSessionId ?? "closed"}
        sessionId={openSessionId}
        onClose={() => setOpenSessionId(null)}
        onChanged={sessionsResource.refresh}
      />
    </div>
  );
}
