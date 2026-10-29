import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import HorseSelect from "./HorseSelect";
import LockTableRow, { LOCK_GRID } from "./LockTableRow";
import LockDetailDrawer from "./LockDetailDrawer";
import ReleaseLockDialog from "./ReleaseLockDialog";
import { getHorses, getMedicalRecords, getTrainingLocks, getVets, releaseTrainingLock } from "../../services/vetService";
// Lịch tập + đăng ký thi đấu nằm trong kho của HLV trưởng — chỉ đọc để hiện "Tác động" của lệnh khóa
import { getRaceRegistrations, getRaces, getSchedules } from "../../services/trainerService";
import { addAuditLog } from "../../services/auditService";
import { todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const STATUS_FILTERS = [
  { value: "active", label: "Đang khóa" },
  { value: "released", label: "Đã gỡ" },
  { value: "all", label: "Tất cả" },
];
const HEAD_CELL = "text-xs font-medium tracking-wide text-stone uppercase";

// Lệnh khóa huấn luyện (TRAININGLOCK) của bác sĩ thú y: danh sách gọn + ngăn chi tiết bên phải (cùng bố cục /vet/exams).
// "Đang khóa" = NgayGo rỗng. Gỡ khóa: chọn tình trạng sức khỏe mới; không có thao tác xóa (giữ lịch sử).
// ?horse=ID lọc sẵn 1 ngựa (khi đó mặc định xem "Tất cả" để thấy cả lệnh đã gỡ của ngựa đó).
export default function TrainingLocks() {
  const { user } = useAuth();
  const currentVetId = toUserID(user.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayISO();

  const [locks, setLocks] = useState([]);
  const [horses, setHorses] = useState([]);
  const [records, setRecords] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [raceRegs, setRaceRegs] = useState([]); // đăng ký kèm ngày giải: [{ HorseID, Ngay }]
  const [vetNames, setVetNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("horse") ? "all" : "active");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(null); // LockID đang mở trong ngăn chi tiết
  const [releasing, setReleasing] = useState(false); // đang mở hộp gỡ khóa
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [toast, setToast] = useState(location.state?.toast ?? null);

  // Đọc xong thông báo từ form thì xóa khỏi history để Back/F5 không hiện lại
  useEffect(() => {
    if (location.state) navigate({ search: location.search }, { replace: true, state: null });
  }, [location.state, location.search, navigate]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getTrainingLocks(), getHorses(), getMedicalRecords(), getSchedules(), getRaceRegistrations(), getRaces(), getVets()]).then(
      ([lockList, horseList, recordList, scheduleList, regList, raceList, vetList]) => {
        if (ignore) return;
        setLocks(lockList);
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setRecords(recordList);
        setSchedules(scheduleList);
        setRaceRegs(regList.map((r) => ({ HorseID: r.HorseID, Ngay: raceList.find((race) => race.RaceID === r.RaceID)?.Ngay ?? "" })));
        setVetNames(Object.fromEntries(vetList.map((v) => [v.UserID, v.HoTen])));
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  const closeToast = useCallback(() => setToast(null), []);
  // Hộp gỡ khóa đang mở thì Esc chỉ đóng hộp, không đóng ngăn chi tiết phía sau.
  // Đọc qua ref để closeDrawer không đổi (ngăn chi tiết không chạy lại hiệu ứng focus khi mở/đóng hộp).
  const releasingRef = useRef(false);
  useEffect(() => {
    releasingRef.current = releasing;
  }, [releasing]);
  const closeDrawer = useCallback(() => {
    if (!releasingRef.current) setSelectedId(null);
  }, []);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const horseFilter = horseById[searchParams.get("horse")] ? Number(searchParams.get("horse")) : null;
  const selectHorse = (horseId) => setSearchParams(horseId ? { horse: horseId } : {});
  const clearFilters = () => {
    setKeyword("");
    setStatusFilter("active");
    setSearchParams({});
  };

  // Lọc ngựa + từ khóa (tên ngựa / lý do) trước; chip trạng thái lọc sau để đếm "Đang khóa · N" theo bộ lọc
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");
  const baseLocks = locks.filter(
    (l) =>
      (!horseFilter || l.HorseID === horseFilter) &&
      (!normalizedKeyword ||
        [horseById[l.HorseID]?.Ten, l.LyDo].some((text) => text?.toLocaleLowerCase("vi").includes(normalizedKeyword)))
  );
  const activeCount = baseLocks.filter((l) => !l.NgayGo).length;
  const releasedCount = baseLocks.length - activeCount;
  // Sắp: đang khóa trước (ngày đặt mới nhất trước), rồi đã gỡ (ngày gỡ mới nhất trước)
  const visibleLocks = baseLocks
    .filter((l) => statusFilter === "all" || (statusFilter === "active" ? !l.NgayGo : l.NgayGo))
    .sort((a, b) => Boolean(a.NgayGo) - Boolean(b.NgayGo) || (b.NgayGo ?? b.NgayDat).localeCompare(a.NgayGo ?? a.NgayDat));

  const selected = locks.find((l) => l.LockID === selectedId);
  const selectedHorse = selected && horseById[selected.HorseID];
  const relatedExam = selected && records.find((r) => r.HorseID === selected.HorseID && r.Ngay === selected.NgayDat);
  const impact = {
    schedules: selected ? schedules.filter((s) => s.HorseID === selected.HorseID && s.Ngay >= today).length : 0,
    races: selected ? raceRegs.filter((r) => r.HorseID === selected.HorseID && r.Ngay >= today).length : 0,
  };

  const handleRelease = async (newStatus) => {
    setReleaseLoading(true);
    try {
      const released = await releaseTrainingLock(selected.LockID, newStatus);
      const horseName = selectedHorse?.Ten ?? "ngựa";
      addAuditLog({
        UserID: currentVetId,
        HanhDong: "Gỡ lệnh khóa huấn luyện",
        TargetTable: "TRAININGLOCK",
        TargetID: released.LockID,
        targetLabel: horseName,
      });
      setLocks((prev) => prev.map((l) => (l.LockID === released.LockID ? released : l)));
      setReleasing(false);
      setToast({ text: `Đã gỡ khóa huấn luyện cho ${horseName}` });
    } catch (err) {
      setToast({ text: err.message, error: true });
    } finally {
      setReleaseLoading(false);
    }
  };

  const countLine = statusFilter === "released" ? `${releasedCount} lệnh khóa đã gỡ` : `${activeCount} lệnh khóa đang hiệu lực`;
  const isDefaultFilter = statusFilter === "active" && !normalizedKeyword && !horseFilter;

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Lệnh khóa huấn luyện</h1>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatusFilter(f.value)}
                    className={`h-9 cursor-pointer rounded-full border px-3.5 text-sm transition-colors ${
                      active ? "border-brass bg-brass/15 font-medium text-brass-deep" : "border-stone/25 bg-white text-ink hover:border-stone/40"
                    }`}
                  >
                    {f.value === "active" ? `${f.label} · ${activeCount}` : f.label}
                  </button>
                );
              })}
            </div>
            <div className="relative w-full sm:w-64">
              <label htmlFor="lockKeyword" className="sr-only">
                Tìm theo tên ngựa, lý do
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
              <input
                id="lockKeyword"
                type="search"
                placeholder="Tìm ngựa, lý do..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-full border border-stone/20 bg-white pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>
            <HorseSelect horses={horses} value={horseFilter} onChange={selectHorse} />
            <Link
              to={`/vet/locks/new${horseFilter ? `?horse=${horseFilter}` : ""}`}
              className="btn-primary ml-auto"
            >
              + Đặt lệnh khóa
            </Link>
          </div>
          <p className="mt-2 text-[13px] text-stone">{countLine}</p>

          {visibleLocks.length === 0 ? (
            <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">
              {isDefaultFilter ? (
                "Hiện không có ngựa nào bị khóa huấn luyện."
              ) : (
                <>
                  Không có lệnh khóa nào khớp bộ lọc.{" "}
                  <button type="button" onClick={clearFilters} className="cursor-pointer font-medium text-brass-deep underline-offset-2 hover:underline">
                    Xóa bộ lọc
                  </button>
                </>
              )}
            </p>
          ) : (
            <div className="mt-5 caret-transparent">
              <div aria-hidden="true" className={`border-b border-stone/20 pr-2 pb-2 pl-3 ${LOCK_GRID}`}>
                <span className={HEAD_CELL}>
                  Ngựa<span className="min-[900px]:hidden"> · lý do</span>
                </span>
                <span className={`hidden min-[900px]:block ${HEAD_CELL}`}>Lý do</span>
                <span className={`text-right min-[900px]:text-left ${HEAD_CELL}`}>
                  Ngày đặt<span className="min-[900px]:hidden"> · thời gian</span>
                </span>
                <span className={`hidden min-[900px]:block ${HEAD_CELL}`}>Thời gian</span>
                <span className={`hidden min-[900px]:block ${HEAD_CELL}`}>Ngày gỡ</span>
                <span className={`hidden text-right min-[900px]:block ${HEAD_CELL}`}>Bác sĩ đặt</span>
              </div>
              <ul>
                {visibleLocks.map((lock) => (
                  <LockTableRow
                    key={lock.LockID}
                    lock={lock}
                    horse={horseById[lock.HorseID]}
                    vetName={vetNames[lock.VetID]}
                    selected={lock.LockID === selectedId}
                    onSelect={(l) => setSelectedId(l.LockID)}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <LockDetailDrawer
        lock={selected}
        horse={selectedHorse}
        vetName={selected && vetNames[selected.VetID]}
        relatedExam={relatedExam}
        impact={impact}
        onRelease={() => setReleasing(true)}
        onClose={closeDrawer}
      />

      {releasing && selected && (
        <ReleaseLockDialog
          horseName={selectedHorse?.Ten ?? "ngựa"}
          loading={releaseLoading}
          onConfirm={handleRelease}
          onCancel={() => setReleasing(false)}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
