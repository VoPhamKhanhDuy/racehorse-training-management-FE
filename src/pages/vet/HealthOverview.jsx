import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import OverviewActionItem from "./OverviewActionItem";
import OverviewAttentionRow from "./OverviewAttentionRow";
import OverviewGoodRow from "./OverviewGoodRow";
import OverviewIncidentItem from "./OverviewIncidentItem";
import { getActiveTrainingLocks, getHealthStatuses, getHorses, getMedicalRecords, getVaccinations } from "../../services/vetService";
// Buổi tập (TRAININGSESSION) nằm trong kho của HLV trưởng — chỉ đọc để cảnh báo nhịp tim
import { getTrainingSessions } from "../../services/trainerService";
// Sự cố sức khỏe ngựa mới (mock dùng chung với trang Sự cố) — chỉ đọc
import { getIncidentsForVet } from "../../services/careService";
import { NO_INJURY } from "../../data/medicalRecordOptions";
import { getHealthAlerts, getVaccineState } from "../../utils/healthAlerts";
import { INCIDENT_STATUS } from "../../data/incidentOptions";
import { daysSince, formatDate, formatDayMonth, todayISO } from "../../utils/date";

const MAX_ACTIONS = 5; // hàng đợi tối đa 5 việc
const VISIBLE_ACTIONS = 3; // hiện sẵn 3 việc, còn lại gom vào "Xem thêm"
const ATTENTION_ORDER = { "Đang điều trị": 0, "Cần theo dõi": 1 };
const SECTION_TITLE = "font-serif text-xl font-semibold text-[#2b2118]";
const FRAME = "mt-3 overflow-hidden rounded-[4px] border border-[#b9ab90] bg-white";
const HEAD = "border-b border-[#b9ab90] bg-[#4a3a2a] px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-[#f3ede0]";
const PAGE = "mx-auto w-full max-w-[1280px] md:px-8";

// Hàng tiêu đề nhóm trong Bảng theo dõi: nền be, chữ đậm + số lượng
function GroupRow({ title, count }) {
  return (
    <tr>
      <td colSpan={4} className="border-y border-[#d9cfba] bg-[#f3ede0] px-4 py-2.5 text-[13px] font-semibold text-[#2b2118]">
        {title} <span className="font-normal text-[#6b6055]">· {count}</span>
      </td>
    </tr>
  );
}

// Tổng quan sức khỏe (trang đích của bác sĩ thú y): mục "Cần xử lý" (tính bằng utils/healthAlerts.js theo ngưỡng
// ở config/healthThresholds.js) và "Bảng theo dõi" chia 2 nhóm: Cần chú ý (dòng đầy đủ) / Tình trạng tốt (dòng mỏng).
export default function HealthOverview() {
  const today = todayISO();
  const [data, setData] = useState(null);
  const [showAllActions, setShowAllActions] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock vetService / trainerService)
  useEffect(() => {
    let ignore = false;
    // Sự cố chỉ để bổ sung vào "Cần xử lý": không đọc được thì bỏ qua (các mục còn lại vẫn chạy bình thường)
    const incidentsPromise = getIncidentsForVet().catch(() => []);
    Promise.all([getHorses(), getHealthStatuses(), getMedicalRecords(), getActiveTrainingLocks(), getVaccinations(), getTrainingSessions(), incidentsPromise]).then(
      ([horses, healthStatuses, records, locks, vaccinations, sessions, incidents]) => {
        if (!ignore) setData({ horses, healthStatuses, records, locks, vaccinations, sessions, incidents });
      }
    );
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

  const { horses, healthStatuses, records, locks, vaccinations, sessions, incidents } = data;
  const newIncidents = incidents.filter((r) => r.TrangThai === INCIDENT_STATUS.NEW);
  const statusOf = (horseId) => healthStatuses.find((h) => h.HorseID === horseId)?.TrangThai;
  // records đã sắp mới → cũ: bản ghi đầu tiên của mỗi ngựa là lần khám gần nhất
  const latestRecordByHorse = {};
  for (const record of records) latestRecordByHorse[record.HorseID] ??= record;
  const latestExamDates = Object.fromEntries(Object.values(latestRecordByHorse).map((r) => [r.HorseID, r.Ngay]));
  const lockByHorse = Object.fromEntries(locks.map((l) => [l.HorseID, l]));

  const actions = getHealthAlerts({ horses, healthStatuses, latestExamDates, vaccinations, sessions, today }).slice(0, MAX_ACTIONS);
  const visibleActions = showAllActions ? actions : actions.slice(0, VISIBLE_ACTIONS);
  const hiddenCount = actions.length - VISIBLE_ACTIONS;

  // Vắc-xin cần nhắc của 1 ngựa (vaccinations đã sắp theo NgayHen): mũi quá hạn lâu nhất, hoặc mũi sắp tới gần nhất (getVaccineState)
  const vaccineOf = (horseId) => {
    const own = vaccinations.filter((v) => v.HorseID === horseId);
    return {
      overdue: own.find((v) => getVaccineState(v, today) === "Quá hạn"),
      dueSoon: own.find((v) => getVaccineState(v, today) === "Sắp tới"),
    };
  };

  // Lưu ý quan trọng nhất của ngựa "Cần chú ý": khóa tập → chấn thương → vắc-xin quá hạn → vắc-xin sắp đến hạn
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

  return (
    <div className={PAGE}>
      <OverviewHeader today={today} />

      <section aria-labelledby="overview-actions" className="mt-8">
        <h2 id="overview-actions" className={SECTION_TITLE}>
          Cần xử lý
        </h2>
        {actions.length === 0 && newIncidents.length === 0 ? (
          <p className="py-6 text-sm text-[#4a3f33]">Hôm nay không có việc cần xử lý.</p>
        ) : (
          <div className={FRAME}>
            <ul id="overview-action-list">
              {newIncidents.map((report) => (
                <OverviewIncidentItem key={`incident-${report.ReportID}`} report={report} horse={horses.find((h) => h.HorseID === report.HorseID)} />
              ))}
              {visibleActions.map((item) => (
                <OverviewActionItem key={item.horse.HorseID} {...item} />
              ))}
            </ul>
            {hiddenCount > 0 && (
              <div className="border-t border-[#d9cfba] px-5 py-3">
                <button
                  type="button"
                  onClick={() => setShowAllActions((prev) => !prev)}
                  aria-expanded={showAllActions}
                  aria-controls="overview-action-list"
                  className="cursor-pointer text-sm font-semibold text-[#c2570c] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
                >
                  {showAllActions ? "Thu gọn" : `Xem thêm ${hiddenCount} việc`}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="overview-board" className="mt-8">
        <h2 id="overview-board" className={SECTION_TITLE}>
          Bảng theo dõi
        </h2>

        {/* Nhóm rỗng thì ẩn hẳn, kể cả hàng tiêu đề nhóm */}
        <div className={`${FRAME} overflow-x-auto`}>
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className={HEAD}>Ngựa</th>
                <th className={HEAD}>Tình trạng</th>
                <th className={HEAD}>Khám gần nhất</th>
                <th className={`${HEAD} w-[220px] min-w-[220px]`}>Lưu ý / Vắc-xin</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {attentionHorses.length > 0 && <GroupRow title="Cần chú ý" count={attentionHorses.length} />}
              {attentionHorses.map((horse) => (
                <OverviewAttentionRow
                  key={horse.HorseID}
                  horse={horse}
                  status={statusOf(horse.HorseID)}
                  latestRecord={latestRecordByHorse[horse.HorseID]}
                  note={noteOf(horse.HorseID)}
                />
              ))}
              {goodHorses.length > 0 && <GroupRow title="Tình trạng tốt" count={goodHorses.length} />}
              {goodHorses.map((horse) => {
                const { overdue, dueSoon } = vaccineOf(horse.HorseID);
                return (
                  <OverviewGoodRow
                    key={horse.HorseID}
                    horse={horse}
                    status={statusOf(horse.HorseID)}
                    latestRecord={latestRecordByHorse[horse.HorseID]}
                    vaccine={overdue ?? dueSoon}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
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
