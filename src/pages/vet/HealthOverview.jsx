import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import OverviewBoardTable from "./OverviewBoardTable";
import OverviewFilterBar from "./OverviewFilterBar";
import OverviewTaskTable from "./OverviewTaskTable";
import { getActiveTrainingLocks, getHealthStatuses, getHorses, getMedicalRecords, getRecentSessionVitals, getVaccinations } from "../../services/vetService";
// Sự cố sức khỏe ngựa mới (mock dùng chung với trang Sự cố) — chỉ đọc
import { getIncidentsForVet } from "../../services/careService";
import { NO_INJURY } from "../../data/medicalRecordOptions";
import { ALERT_TYPES, getHealthAlerts, getVaccineState } from "../../utils/healthAlerts";
import { INCIDENT_STATUS } from "../../data/incidentOptions";
import { inRange, periodRange } from "../../utils/dateRange";
import { daysSince, formatDate, formatDayMonth, todayISO } from "../../utils/date";

const ATTENTION_ORDER = { "Đang điều trị": 0, "Chấn thương": 0, "Cách ly": 1, "Cần theo dõi": 2 };
const PAGE_TABS = [
  { value: "actions", label: "Cần xử lý" },
  { value: "board", label: "Bảng theo dõi" },
];
const KINDS = { INCIDENT: "Sự cố", RECHECK: "Tái khám", VACCINE: "Tiêm phòng" };
const TASK_KIND_OPTIONS = [
  { value: "", label: "Loại việc: Tất cả" },
  ...Object.values(KINDS).map((kind) => ({ value: kind, label: kind })),
];
const BOARD_STATUS_OPTIONS = [
  { value: "", label: "Tình trạng: Tất cả" },
  { value: "attention", label: "Cần chú ý" },
  { value: "good", label: "Tình trạng tốt" },
];
const EMPTY_FILTERS = { keyword: "", extra: "", period: "all", from: "", to: "" };
const PAGE = "mx-auto w-full max-w-[1280px] md:px-8";

const capitalizeFirst = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Nội dung ngắn của 1 việc (bỏ phần đã có ở cột Loại việc / Tình trạng)
function contentOf(alert) {
  const message = alert.message.replace(/\.$/, "");
  switch (alert.type) {
    case ALERT_TYPES.VACCINE_OVERDUE:
      return message.replace(/ quá hạn \d+ ngày$/, "");
    case ALERT_TYPES.VACCINE_DUE_SOON:
      return message.replace(/ đến hạn ngày .*$/, "");
    case ALERT_TYPES.RECHECK_TREATING:
      return capitalizeFirst(message.replace(/^Cần tái khám:\s*/, ""));
    default:
      return message;
  }
}

// Tổng quan sức khỏe: 2 tab cấp trang — "Cần xử lý" (bảng: sự cố mới + tái khám + tiêm phòng, có lọc loại việc / thời gian) và
// "Bảng theo dõi" (bảng tình trạng từng ngựa, lọc tình trạng / thời gian theo "Khám gần nhất"). Ngưỡng cảnh báo: utils/healthAlerts.js + config/healthThresholds.js.
// Bộ lọc nhớ trong phiên (state của trang).
export default function HealthOverview() {
  const today = todayISO();
  const [data, setData] = useState(null);
  const [pageTab, setPageTab] = useState("actions"); // cần xử lý | bảng theo dõi
  const [taskFilters, setTaskFilters] = useState(EMPTY_FILTERS);
  const [boardFilters, setBoardFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    let ignore = false;
    // Sự cố chỉ để bổ sung vào "Cần xử lý": không đọc được thì bỏ qua (các mục còn lại vẫn chạy bình thường)
    const incidentsPromise = getIncidentsForVet().catch(() => []);
    Promise.all([getHorses(), getHealthStatuses(), getMedicalRecords(), getActiveTrainingLocks(), getVaccinations(), getRecentSessionVitals(), incidentsPromise])
      .then(([horses, healthStatuses, records, locks, vaccinations, sessions, incidents]) => {
        if (!ignore) setData({ horses, healthStatuses, records, locks, vaccinations, sessions, incidents });
      })
      .catch((err) => {
        if (!ignore) setData({ error: err.message || "Không tải được tổng quan sức khỏe." });
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (!data) {
    return (
      <div className={PAGE}>
        <OverviewHeader today={today} />
        <LoadingState />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className={PAGE}>
        <OverviewHeader today={today} />
        <p className="mt-6 text-sm text-[#c0262d]">{data.error}</p>
      </div>
    );
  }

  const { horses, healthStatuses, records, locks, vaccinations, sessions, incidents } = data;
  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const newIncidents = incidents.filter((r) => r.TrangThai === INCIDENT_STATUS.NEW);
  const statusOf = (horseId) => healthStatuses.find((h) => h.HorseID === horseId)?.TrangThai;
  // records đã sắp mới → cũ: bản ghi đầu tiên của mỗi ngựa là lần khám gần nhất
  const latestRecordByHorse = {};
  for (const record of records) latestRecordByHorse[record.HorseID] ??= record;
  const latestExamDates = Object.fromEntries(Object.values(latestRecordByHorse).map((r) => [r.HorseID, r.Ngay]));
  const lockByHorse = Object.fromEntries(locks.map((l) => [l.HorseID, l]));

  // ---- Danh sách "Cần xử lý": sự cố Mới + việc sức khỏe (mỗi ngựa 1 việc ưu tiên cao nhất, như trước) — HIỂN THỊ ĐỦ, không giới hạn số việc ----
  const alerts = getHealthAlerts({ horses, healthStatuses, latestExamDates, vaccinations, sessions, today });
  const taskItems = [
    ...newIncidents.map((report) => ({
      key: `incident-${report.ReportID}`,
      group: 0,
      date: report.Ngay,
      horse: horseById[report.HorseID] ?? { HorseID: report.HorseID, Ten: report.HorseName },
      kind: KINDS.INCIDENT,
      content: `${report.LoaiSuCo}, báo bởi ${report.ReporterName}`,
      status: "Mới",
      tone: "danger",
      action: { label: "Xử lý", to: `/vet/incidents?report=${report.ReportID}` },
    })),
    ...alerts.map(({ horse, alert, otherCount }) => {
      const isVaccine = alert.type === ALERT_TYPES.VACCINE_OVERDUE || alert.type === ALERT_TYPES.VACCINE_DUE_SOON;
      const overdue = alert.type === ALERT_TYPES.VACCINE_OVERDUE;
      return {
        key: `alert-${horse.HorseID}`,
        group: overdue ? 1 : isVaccine ? 3 : 2,
        date: alert.date,
        horse,
        kind: isVaccine ? KINDS.VACCINE : KINDS.RECHECK,
        content: contentOf(alert),
        otherCount,
        status: overdue ? `Quá hạn ${daysSince(alert.date)} ngày` : isVaccine ? "Sắp đến hạn" : "Cần tái khám",
        tone: overdue ? "danger" : isVaccine ? undefined : "warn",
        action: isVaccine
          ? { label: "Xem lịch tiêm", to: `/vet/vaccinations?horse=${horse.HorseID}` }
          : { label: "Ghi lần khám", to: `/vet/exams/new?horse=${horse.HorseID}` },
      };
    }),
  ];
  // Sắp xếp: sự cố Mới → quá hạn tiêm (lâu nhất trước) → tái khám → còn lại; trong nhóm theo ngày cũ nhất trước (không có ngày xếp cuối nhóm)
  taskItems.sort((a, b) => a.group - b.group || (a.date ?? "9999-12-31").localeCompare(b.date ?? "9999-12-31") || a.horse.Ten.localeCompare(b.horse.Ten, "vi"));

  const rangeOf = (f) => periodRange(f.period, today, f.from, f.to);
  const rangeErrorOf = (f) => (f.period === "custom" && f.from && f.to && f.from > f.to ? "Từ ngày phải trước hoặc bằng Đến ngày." : "");
  const isActive = (f) => Boolean(f.keyword || f.extra || f.period !== "all");

  const taskKeyword = taskFilters.keyword.trim().toLowerCase();
  const taskRange = rangeErrorOf(taskFilters) ? null : rangeOf(taskFilters);
  const filteredTasks = taskItems.filter(
    (item) =>
      (!taskFilters.extra || item.kind === taskFilters.extra) &&
      item.horse.Ten.toLowerCase().includes(taskKeyword) &&
      inRange(item.date, taskRange)
  );

  // ---- Bảng theo dõi ----
  const vaccineOf = (horseId) => {
    const own = vaccinations.filter((v) => v.HorseID === horseId);
    return {
      overdue: own.find((v) => getVaccineState(v, today) === "Quá hạn"),
      dueSoon: own.find((v) => getVaccineState(v, today) === "Sắp tới"),
    };
  };
  // Lưu ý quan trọng nhất của ngựa: khóa tập → chấn thương → vắc-xin quá hạn → vắc-xin sắp đến hạn
  const noteOf = (horseId) => {
    const lock = lockByHorse[horseId];
    if (lock) return `Khóa huấn luyện từ ${formatDayMonth(lock.NgayDat)}`;
    const injury = latestRecordByHorse[horseId]?.ViTriChanThuong;
    if (injury && injury !== NO_INJURY) return injury;
    const { overdue, dueSoon } = vaccineOf(horseId);
    if (overdue) return `Vắc-xin ${overdue.Loai} quá hạn ${daysSince(overdue.NgayHen)} ngày`;
    if (dueSoon) return `Vắc-xin ${dueSoon.Loai} ngày ${formatDayMonth(dueSoon.NgayHen)}`;
    return "";
  };
  const byName = (a, b) => a.Ten.localeCompare(b.Ten, "vi");
  const attentionHorses = horses
    .filter((h) => statusOf(h.HorseID) in ATTENTION_ORDER)
    .sort((a, b) => ATTENTION_ORDER[statusOf(a.HorseID)] - ATTENTION_ORDER[statusOf(b.HorseID)] || byName(a, b));
  const goodHorses = horses.filter((h) => !(statusOf(h.HorseID) in ATTENTION_ORDER)).sort(byName);
  const toBoardRow = (horse, attention) => ({
    horse,
    status: statusOf(horse.HorseID),
    attention,
    latestRecord: latestRecordByHorse[horse.HorseID],
    note: noteOf(horse.HorseID),
  });
  const boardRows = [...attentionHorses.map((h) => toBoardRow(h, true)), ...goodHorses.map((h) => toBoardRow(h, false))];
  const boardKeyword = boardFilters.keyword.trim().toLowerCase();
  const boardRange = rangeErrorOf(boardFilters) ? null : rangeOf(boardFilters);
  const filteredBoard = boardRows.filter(
    (row) =>
      (!boardFilters.extra || (boardFilters.extra === "attention") === row.attention) &&
      row.horse.Ten.toLowerCase().includes(boardKeyword) &&
      // Thời gian lọc theo "Khám gần nhất"; ngựa chưa khám bị loại khi đang lọc khoảng thời gian
      inRange(row.latestRecord?.Ngay, boardRange)
  );

  const tabCounts = { actions: taskItems.length, board: horses.length };

  return (
    <div className={PAGE}>
      <OverviewHeader today={today} />

      <div role="tablist" aria-label="Tổng quan sức khỏe" className="mt-8 flex flex-wrap gap-x-8 border-b border-[#E3E3E3]">
        {PAGE_TABS.map((tab) => {
          const active = pageTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`overview-${tab.value}-panel`}
              id={`overview-${tab.value}-tab`}
              onClick={() => setPageTab(tab.value)}
              className={`-mb-px cursor-pointer border-b-2 px-1 pb-2.5 text-base text-[#1f1f1f] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c] ${
                active ? "border-[#c2570c] font-semibold" : "border-transparent font-medium hover:border-[#E3E3E3]"
              }`}
            >
              {tab.label} <span className="tabular-nums">({tabCounts[tab.value]})</span>
            </button>
          );
        })}
      </div>

      {pageTab === "actions" ? (
        <section role="tabpanel" id="overview-actions-panel" aria-labelledby="overview-actions-tab" className="mt-5">
          <h2 className="sr-only">Cần xử lý</h2>
          <OverviewFilterBar
            filters={taskFilters}
            onChange={(patch) => setTaskFilters((prev) => ({ ...prev, ...patch }))}
            onClear={() => setTaskFilters(EMPTY_FILTERS)}
            active={isActive(taskFilters)}
            extra={{ label: "Loại việc", options: TASK_KIND_OPTIONS }}
            rangeError={rangeErrorOf(taskFilters)}
          />
          <OverviewTaskTable
            key={JSON.stringify(taskFilters)}
            items={filteredTasks}
            emptyText={taskItems.length === 0 ? "Hôm nay không có việc cần xử lý." : "Không có việc cần xử lý trong khoảng thời gian này."}
          />
        </section>
      ) : (
        <section role="tabpanel" id="overview-board-panel" aria-labelledby="overview-board-tab" className="mt-5">
          <h2 className="sr-only">Bảng theo dõi</h2>
          <OverviewFilterBar
            filters={boardFilters}
            onChange={(patch) => setBoardFilters((prev) => ({ ...prev, ...patch }))}
            onClear={() => setBoardFilters(EMPTY_FILTERS)}
            active={isActive(boardFilters)}
            extra={{ label: "Tình trạng", options: BOARD_STATUS_OPTIONS }}
            periodLabel="Khám gần nhất"
            rangeError={rangeErrorOf(boardFilters)}
          />
          <OverviewBoardTable
            key={JSON.stringify(boardFilters)}
            rows={filteredBoard}
            emptyText={horses.length === 0 ? "Chưa có ngựa nào." : "Không có ngựa nào khớp bộ lọc."}
          />
        </section>
      )}
    </div>
  );
}

function OverviewHeader({ today }) {
  return (
    <>
      <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Tổng quan sức khỏe</h1>
      <p className="mt-1 text-sm text-[#4a3f33]">Hôm nay, {formatDate(today)}</p>
    </>
  );
}
