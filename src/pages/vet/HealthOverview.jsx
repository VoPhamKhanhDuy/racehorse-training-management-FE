import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import OverviewActionItem from "./OverviewActionItem";
import OverviewAttentionRow, { BOARD_GRID } from "./OverviewAttentionRow";
import OverviewGoodRow from "./OverviewGoodRow";
import { getActiveTrainingLocks, getHealthStatuses, getHorses, getMedicalRecords, getVaccinations } from "../../services/vetService";
// Buổi tập (TRAININGSESSION) nằm trong kho của HLV trưởng — chỉ đọc để cảnh báo nhịp tim
import { getTrainingSessions } from "../../services/trainerService";
import { NO_INJURY } from "../../data/medicalRecordOptions";
import { getHealthAlerts, getVaccineState } from "../../utils/healthAlerts";
import { daysSince, formatDate, formatDayMonth, todayISO } from "../../utils/date";

const MAX_ACTIONS = 5; // hàng đợi tối đa 5 việc
const VISIBLE_ACTIONS = 3; // hiện sẵn 3 việc, còn lại gom vào "Xem thêm"
const ATTENTION_ORDER = { "Đang điều trị": 0, "Cần theo dõi": 1 };
const SECTION_TITLE = "border-b border-stone/20 pb-2 font-serif text-[22px] font-semibold text-ink";
const GROUP_LABEL = "border-b border-stone/20 pb-1.5 text-xs font-medium tracking-wide text-stone uppercase";
const BOARD_COLUMNS = ["Ngựa", "Tình trạng", "Khám gần nhất", "Lưu ý", ""];

// Tổng quan sức khỏe (trang đích của bác sĩ thú y): mục "Cần xử lý" (tính bằng utils/healthAlerts.js theo ngưỡng
// ở config/healthThresholds.js) và "Bảng theo dõi" chia 2 nhóm: Cần chú ý (dòng đầy đủ) / Tình trạng tốt (dòng mỏng).
export default function HealthOverview() {
  const today = todayISO();
  const [data, setData] = useState(null);
  const [showAllActions, setShowAllActions] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock vetService / trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getHealthStatuses(), getMedicalRecords(), getActiveTrainingLocks(), getVaccinations(), getTrainingSessions()]).then(
      ([horses, healthStatuses, records, locks, vaccinations, sessions]) => {
        if (!ignore) setData({ horses, healthStatuses, records, locks, vaccinations, sessions });
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="max-w-[1100px]">
        <OverviewHeader today={today} />
        <LoadingState />
      </div>
    );
  }

  const { horses, healthStatuses, records, locks, vaccinations, sessions } = data;
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
    <div className="max-w-[1100px]">
      <OverviewHeader today={today} />

      <section aria-labelledby="overview-actions" className="mt-6">
        <h2 id="overview-actions" className={SECTION_TITLE}>
          Cần xử lý
        </h2>
        {actions.length === 0 ? (
          <p className="py-6 text-sm text-stone">Hôm nay không có việc cần xử lý.</p>
        ) : (
          <>
            <ul id="overview-action-list">
              {visibleActions.map((item) => (
                <OverviewActionItem key={item.horse.HorseID} {...item} />
              ))}
            </ul>
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllActions((prev) => !prev)}
                aria-expanded={showAllActions}
                aria-controls="overview-action-list"
                className="mt-2 cursor-pointer text-sm font-medium text-brass-deep underline-offset-2 hover:underline"
              >
                {showAllActions ? "Thu gọn" : `Xem thêm ${hiddenCount} việc`}
              </button>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="overview-board" className="mt-8">
        <h2 id="overview-board" className={SECTION_TITLE}>
          Bảng theo dõi
        </h2>

        {/* Nhóm rỗng thì ẩn hẳn, kể cả tiêu đề nhóm */}
        {attentionHorses.length > 0 && (
          <div className="mt-4">
            <h3 className={GROUP_LABEL}>Cần chú ý · {attentionHorses.length}</h3>
            {/* Hàng tiêu đề cột nhỏ — chỉ khi chia cột (từ 900px) */}
            <div aria-hidden="true" className={`hidden py-1.5 pr-2 pl-3 text-xs text-stone ${BOARD_GRID}`}>
              {BOARD_COLUMNS.map((column) => (
                <span key={column || "chevron"}>{column}</span>
              ))}
            </div>
            <ul className="border-t border-stone/15 min-[900px]:border-t-0">
              {attentionHorses.map((horse) => (
                <OverviewAttentionRow
                  key={horse.HorseID}
                  horse={horse}
                  status={statusOf(horse.HorseID)}
                  latestRecord={latestRecordByHorse[horse.HorseID]}
                  note={noteOf(horse.HorseID)}
                />
              ))}
            </ul>
          </div>
        )}

        {goodHorses.length > 0 && (
          <div className="mt-6">
            <h3 className={GROUP_LABEL}>Tình trạng tốt · {goodHorses.length}</h3>
            <ul>
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
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewHeader({ today }) {
  return (
    <>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Tổng quan sức khỏe</h1>
      <p className="mt-1 text-sm text-stone">Hôm nay, {formatDate(today)}</p>
    </>
  );
}
