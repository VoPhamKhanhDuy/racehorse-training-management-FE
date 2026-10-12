import TrainingLockNotice from "../../components/TrainingLockNotice";
import { LOCK_CONFLICT_RACE } from "../../utils/trainingLock";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import RaceMatrix from "./RaceMatrix";
import RaceResultPopover from "./RaceResultPopover";
import {
  BLOCKING_HEALTH_STATUS,
  cancelRaceRegistration,
  getActiveTrainingLocks,
  getHealthStatuses,
  getHorses,
  getRaceRegistrations,
  getRaces,
  getTrainingSessions,
  registerHorseForRace,
  updateRaceResult,
} from "../../services/trainerService";
import { addAuditLog } from "../../services/auditService";
import { addDays, formatDayMonth, todayISO } from "../../utils/date";
import { NO_RANK, hasResult } from "../../utils/raceResult";
import { toUserID } from "../../utils/userId";

// Nhãn kết quả trong toast / nhật ký: "hạng 2" | "không xếp hạng" | "chưa có kết quả"
const resultText = (rank) => (rank === null ? "chưa có kết quả" : rank === NO_RANK ? "không xếp hạng" : `hạng ${rank}`);

const VIEW_TABS = [
  { value: "upcoming", label: "Sắp tới" },
  { value: "past", label: "Đã diễn ra" },
];
const RECENT_TRAINING_DAYS = 14; // tham khảo: ngựa có buổi tập trong 14 ngày gần đây không
const TOAST_MS = 3500;

// Đăng ký thi đấu: ma trận ngựa × giải (RACE chỉ đọc). Bấm "+" để đăng ký, bấm chip "Đã đăng ký" để hủy (RACEREGISTRATION).
// Chặn: ngựa đang khóa tập (TRAININGLOCK) hoặc HEALTHSTATUS "Đang điều trị"; sức khỏe khác "Tốt" thì hỏi xác nhận.
// Giải đã diễn ra: bấm ô ngựa đã đăng ký để nhập/sửa thứ hạng (RACEREGISTRATION.ThuHang) qua popover; sửa kết quả đã có thì hỏi lại.
export default function Races() {
  const today = todayISO();
  const { user } = useAuth();
  const trainerId = toUserID(user.id);
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [horses, setHorses] = useState([]);
  const [locks, setLocks] = useState([]); // lệnh khóa đang hiệu lực
  const [healthByHorse, setHealthByHorse] = useState({});
  const [sessionDatesByHorse, setSessionDatesByHorse] = useState({});
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(new URLSearchParams(window.location.search).get("q") ?? "");
  const [tab, setTab] = useState("upcoming");
  const [savingKey, setSavingKey] = useState(null); // "HorseID|RaceID" đang ghi
  const [healthConfirm, setHealthConfirm] = useState(null); // { horse, race, status }
  const [cancelTarget, setCancelTarget] = useState(null); // { horse, race }
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null); // { text, error }
  const [resultTarget, setResultTarget] = useState(null); // { horse, race, anchor } — popover nhập hạng đang mở
  const [resultConfirm, setResultConfirm] = useState(null); // { horse, race, rank } — chờ xác nhận sửa kết quả đã nhập
  const [savingResult, setSavingResult] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getRaces(), getRaceRegistrations(), getHorses(), getActiveTrainingLocks(), getHealthStatuses(), getTrainingSessions()]).then(
      ([raceList, regList, horseList, lockList, healthList, sessionList]) => {
        if (ignore) return;
        setRaces(raceList);
        setRegistrations(regList);
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setLocks(lockList);
        setHealthByHorse(Object.fromEntries(healthList.map((h) => [h.HorseID, h.TrangThai])));
        setSessionDatesByHorse(sessionList.reduce((acc, s) => ({ ...acc, [s.HorseID]: [...(acc[s.HorseID] ?? []), s.Ngay] }), {}));
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  // Toast tự ẩn
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sắp tới: ngày tăng dần; đã diễn ra: mới nhất trước
  const visibleRaces = races
    .filter((r) => (tab === "upcoming" ? r.Ngay >= today : r.Ngay < today))
    .sort((a, b) => (tab === "upcoming" ? a.Ngay.localeCompare(b.Ngay) : b.Ngay.localeCompare(a.Ngay)))
    .map((r) => ({ ...r, isPast: r.Ngay < today }));
  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleHorses = horses.filter((h) => h.Ten.toLowerCase().includes(normalizedKeyword));

  const registrationByKey = Object.fromEntries(registrations.map((r) => [`${r.HorseID}|${r.RaceID}`, r]));
  const lockedHorseIds = new Set(locks.map((l) => l.HorseID));
  // Ngựa đang bị khóa nhưng còn đăng ký giải sắp tới (đăng ký trước khi khóa): không tự rút, nhắc HLV tự xử lý
  const lockConflicts = locks
    .map((lock) => ({
      lock,
      horse: horses.find((h) => h.HorseID === lock.HorseID),
      upcoming: registrations
        .map((r) => (r.HorseID === lock.HorseID ? races.find((race) => race.RaceID === r.RaceID) : null))
        .filter((race) => race && race.Ngay >= today)
        .sort((a, b) => a.Ngay.localeCompare(b.Ngay)),
    }))
    .filter((c) => c.horse && c.upcoming.length > 0);
  const recentStart = addDays(today, -RECENT_TRAINING_DAYS);
  const horseInfoById = Object.fromEntries(
    horses.map((horse) => {
      const health = healthByHorse[horse.HorseID];
      const dates = sessionDatesByHorse[horse.HorseID] ?? [];
      // Khóa tập ưu tiên hơn "Đang điều trị" khi ngựa bị cả hai
      const blockReason = lockedHorseIds.has(horse.HorseID) ? "Đang khóa tập" : health === BLOCKING_HEALTH_STATUS ? "Đang điều trị" : null;
      return [
        horse.HorseID,
        {
          blockReason,
          locked: lockedHorseIds.has(horse.HorseID),
          health,
          lastSession: dates.reduce((max, d) => (d > max ? d : max), ""),
          trainedRecently: dates.some((d) => d >= recentStart && d <= today),
        },
      ];
    })
  );

  const doRegister = async (horse, race) => {
    const key = `${horse.HorseID}|${race.RaceID}`;
    setSavingKey(key);
    try {
      const registration = await registerHorseForRace(race.RaceID, horse.HorseID);
      setRegistrations((prev) => [...prev, registration]);
      setToast({ text: `Đã đăng ký ${horse.Ten} vào ${race.TenGiai}` });
    } catch (err) {
      setToast({ text: err.message, error: true });
    }
    setSavingKey(null);
  };

  // Sức khỏe khác "Tốt" (ngựa "Đang điều trị" đã bị chặn ở ô): hỏi xác nhận trước khi ghi
  const handleRegister = (horse, race) => {
    const status = horseInfoById[horse.HorseID].health;
    if (status && status !== "Tốt") setHealthConfirm({ horse, race, status });
    else doRegister(horse, race);
  };

  const handleConfirmCancel = async () => {
    const { horse, race } = cancelTarget;
    setCancelling(true);
    try {
      await cancelRaceRegistration(race.RaceID, horse.HorseID);
      setRegistrations((prev) => prev.filter((r) => !(r.RaceID === race.RaceID && r.HorseID === horse.HorseID)));
      setToast({ text: "Đã hủy đăng ký" });
    } catch (err) {
      setToast({ text: err.message, error: true });
    }
    setCancelling(false);
    setCancelTarget(null);
  };

  const closeResultPopover = useCallback(() => setResultTarget(null), []);

  const doSaveResult = async (horse, race, rank) => {
    setSavingResult(true);
    try {
      const { registration: saved, prizeCleared } = await updateRaceResult(race.RaceID, horse.HorseID, rank);
      setRegistrations((prev) => prev.map((r) => (r.RaceID === saved.RaceID && r.HorseID === saved.HorseID ? saved : r)));
      addAuditLog({
        UserID: trainerId,
        HanhDong: `Cập nhật kết quả thi đấu: ${race.TenGiai} – ${horse.Ten} ${resultText(rank)}`,
        TargetTable: "RACEREGISTRATION",
        TargetID: race.RaceID,
        targetLabel: horse.Ten,
      });
      setToast({
        text: `Đã lưu kết quả: ${horse.Ten} – ${resultText(rank)}${prizeCleared ? ". Đã xóa tiền thưởng cũ, Quản lý cần nhập lại" : ""}`,
      });
      setResultTarget(null);
    } catch (err) {
      setToast({ text: err.message, error: true });
    }
    setSavingResult(false);
  };

  // Không đổi gì thì chỉ đóng; sửa kết quả đã nhập thì hỏi xác nhận trước
  const handleSaveResult = (rank) => {
    const { horse, race } = resultTarget;
    const registration = registrationByKey[`${horse.HorseID}|${race.RaceID}`];
    if (rank === registration.ThuHang) setResultTarget(null);
    else if (hasResult(registration)) {
      setResultTarget(null);
      setResultConfirm({ horse, race, rank });
    } else doSaveResult(horse, race, rank);
  };

  const resultRegistration = resultTarget && registrationByKey[`${resultTarget.horse.HorseID}|${resultTarget.race.RaceID}`];
  const resultEntries = resultTarget
    ? registrations
        .filter((r) => r.RaceID === resultTarget.race.RaceID)
        .map((r) => ({ ...r, horseName: horses.find((h) => h.HorseID === r.HorseID)?.Ten ?? `Ngựa #${r.HorseID}` }))
    : [];

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Đăng ký thi đấu</h1>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <label htmlFor="raceHorseKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
              <input
                id="raceHorseKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>
            {/* Công tắc chữ "Sắp tới | Đã diễn ra" — cùng kiểu pill lọc */}
            <div role="radiogroup" aria-label="Thời điểm giải đua" className="inline-flex rounded-full border border-stone/25 bg-white p-0.5">
              {VIEW_TABS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={tab === option.value}
                  onClick={() => setTab(option.value)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    tab === option.value ? "bg-brass/15 font-medium text-brass-deep" : "text-ink hover:bg-black/[0.03]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {lockConflicts.length > 0 && (
            <div className="mt-4 space-y-2">
              {lockConflicts.map(({ lock, horse, upcoming }) => (
                <TrainingLockNotice
                  key={lock.LockID}
                  lock={lock}
                  horseName={horse.Ten}
                  hint={`${LOCK_CONFLICT_RACE}: ${upcoming.map((race) => `${race.TenGiai} (${formatDayMonth(race.Ngay)})`).join(", ")}.`}
                />
              ))}
            </div>
          )}
          <p className="mt-3 mb-4 text-xs text-stone">
            {tab === "upcoming"
              ? "Viền cam: đã đăng ký · Bấm + để đăng ký · Bấm ô đã đăng ký để hủy"
              : "Bấm ô ngựa đã đăng ký để nhập hoặc sửa thứ hạng"}
          </p>

          {visibleRaces.length === 0 ? (
            <p className="rounded-lg border border-gridline bg-white px-4 py-12 text-center text-sm text-stone">
              {tab === "upcoming" ? "Chưa có giải đua sắp tới." : "Chưa có giải đua nào đã diễn ra."}
            </p>
          ) : (
            <RaceMatrix
              races={visibleRaces}
              horses={visibleHorses}
              horseInfoById={horseInfoById}
              registrationByKey={registrationByKey}
              savingKey={savingKey}
              emptyText="Không tìm thấy ngựa nào khớp."
              onRegister={handleRegister}
              onCancel={(horse, race) => setCancelTarget({ horse, race })}
              onOpenResult={(horse, race, anchor) => setResultTarget({ horse, race, anchor })}
            />
          )}
        </>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded-md border border-gridline border-l-2 bg-white px-4 py-3 text-sm shadow-lg ${
            toast.error ? "border-l-[#9e5954] text-[#9e5954]" : "border-l-green-700 text-green-800"
          }`}
        >
          {toast.text}
          <button type="button" onClick={() => setToast(null)} className="shrink-0 cursor-pointer text-xs font-semibold text-stone hover:text-ink">
            Đóng
          </button>
        </div>
      )}

      {resultTarget && resultRegistration && (
        <RaceResultPopover
          key={`${resultTarget.horse.HorseID}|${resultTarget.race.RaceID}`}
          horse={resultTarget.horse}
          race={resultTarget.race}
          registration={resultRegistration}
          entries={resultEntries}
          anchor={resultTarget.anchor}
          saving={savingResult}
          onSave={handleSaveResult}
          onClose={closeResultPopover}
        />
      )}
      <ConfirmDialog
        open={Boolean(resultConfirm)}
        title="Sửa kết quả thi đấu"
        message="Kết quả này đã được nhập. Bạn có chắc muốn thay đổi?"
        confirmLabel="Lưu thay đổi"
        cancelLabel="Không"
        danger={false}
        loading={savingResult}
        onConfirm={async () => {
          const { horse, race, rank } = resultConfirm;
          await doSaveResult(horse, race, rank);
          setResultConfirm(null);
        }}
        onCancel={() => setResultConfirm(null)}
      />
      <ConfirmDialog
        open={Boolean(healthConfirm)}
        title="Cảnh báo sức khỏe"
        message={healthConfirm ? `${healthConfirm.horse.Ten} đang ở trạng thái '${healthConfirm.status}'. Bạn vẫn muốn đăng ký?` : ""}
        confirmLabel="Vẫn đăng ký"
        cancelLabel="Không"
        danger={false}
        onConfirm={() => {
          const { horse, race } = healthConfirm;
          setHealthConfirm(null);
          doRegister(horse, race);
        }}
        onCancel={() => setHealthConfirm(null)}
      />
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Hủy đăng ký"
        message={cancelTarget ? `Hủy đăng ký ${cancelTarget.horse.Ten} khỏi ${cancelTarget.race.TenGiai}?` : ""}
        confirmLabel="Hủy đăng ký"
        cancelLabel="Giữ lại"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
