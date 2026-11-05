import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import TablePager from "../../components/TablePager";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import LockReleaseDialog from "./LockReleaseDialog";
import LockTableRow from "./LockTableRow";
import LockViewDialog from "./LockViewDialog";
import { getHorses, getMedicalRecords, getTrainingLocks, getVets, releaseTrainingLock } from "../../services/vetService";
import { getLockReleaseNotes, saveLockReleaseNote } from "../../services/lockReleaseNoteMock";
import { addAuditLog } from "../../services/auditService";
import { inRange, periodRange } from "../../utils/dateRange";
import { todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";
import DateInput from "../../components/DateInput";

const PAGE_SIZE = 10;
const TH = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const FIELD = "h-10 w-full rounded-[4px] border border-[#E3E3E3] bg-white text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]";
const STATUS_OPTIONS = [
  { value: "active", label: "Đang khóa" },
  { value: "released", label: "Đã gỡ" },
  { value: "all", label: "Tất cả" },
];
const PERIOD_OPTIONS = [
  { value: "all", label: "Ngày đặt: Tất cả" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "custom", label: "Tùy chọn" },
];

function SelectBox({ id, label, value, onChange, children, width = "sm:w-44" }) {
  return (
    <div className={`relative w-full ${width}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={onChange} className={`${FIELD} cursor-pointer appearance-none pr-9 pl-3.5`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
    </div>
  );
}

// Lệnh khóa huấn luyện (TRAININGLOCK) của bác sĩ thú y: bảng STT | Ngựa | Lý do | Ngày đặt | Đã khóa | Ngày gỡ | Bác sĩ đặt | Trạng thái | Thao tác.
// "Đang khóa" = NgayGo rỗng → "Gỡ khóa" mở modal (chọn tình trạng sức khỏe mới + ghi chú); đã gỡ → "Xem" mở modal chỉ đọc. Không có xóa (giữ lịch sử).
// API gỡ: POST /api/vet/training-locks/{id}/release { trangThai } — BE CHƯA lưu ghi chú / người gỡ nên ghi chú để ở mock (services/lockReleaseNoteMock.js).
// ?horse=ID lọc sẵn 1 ngựa (khi đó mặc định xem "Tất cả" để thấy cả lệnh đã gỡ của ngựa đó).
export default function TrainingLocks() {
  const { user } = useAuth();
  const currentVetId = toUserID(user.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultStatus = searchParams.get("horse") ? "all" : "active";

  const [locks, setLocks] = useState([]);
  const [horses, setHorses] = useState([]);
  const [records, setRecords] = useState([]);
  const [vetNames, setVetNames] = useState({});
  const [releaseNotes, setReleaseNotes] = useState(getLockReleaseNotes);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState({ keyword: "", status: defaultStatus, period: "all", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [releaseId, setReleaseId] = useState(null); // LockID đang mở modal gỡ khóa
  const [viewId, setViewId] = useState(null); // LockID đang mở modal xem
  const [toast, setToast] = useState(location.state?.toast ?? null);

  // Đọc xong thông báo từ form thì xóa khỏi history để Back/F5 không hiện lại
  useEffect(() => {
    if (location.state) navigate({ search: location.search }, { replace: true, state: null });
  }, [location.state, location.search, navigate]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getTrainingLocks(), getHorses(), getMedicalRecords(), getVets()])
      .then(([lockList, horseList, recordList, vetList]) => {
        if (ignore) return;
        setLocks(lockList);
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setRecords(recordList);
        setVetNames(Object.fromEntries(vetList.map((v) => [v.UserID, v.HoTen])));
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message || "Không tải được lệnh khóa huấn luyện.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const horseFilter = horseById[searchParams.get("horse")] ? Number(searchParams.get("horse")) : null;
  const setFilter = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };
  const selectHorse = (horseId) => {
    setSearchParams(horseId ? { horse: horseId } : {});
    setPage(1);
  };
  const clearFilters = () => {
    setFilters({ keyword: "", status: "active", period: "all", from: "", to: "" });
    setSearchParams({});
    setPage(1);
  };
  const filtersActive = Boolean(horseFilter || filters.keyword || filters.status !== "active" || filters.period !== "all");
  const rangeError = filters.period === "custom" && filters.from && filters.to && filters.from > filters.to ? "Từ ngày phải trước hoặc bằng Đến ngày." : "";
  const range = rangeError ? null : periodRange(filters.period, todayISO(), filters.from, filters.to);

  // Lọc kết hợp AND: ngựa, trạng thái, ngày đặt, từ khóa (tên ngựa / lý do). Sắp: đang khóa trước (ngày đặt mới nhất trước), rồi đã gỡ (ngày gỡ mới nhất trước)
  const normalizedKeyword = filters.keyword.trim().toLocaleLowerCase("vi");
  const visibleLocks = locks
    .filter(
      (l) =>
        (!horseFilter || l.HorseID === horseFilter) &&
        (filters.status === "all" || (filters.status === "active" ? !l.NgayGo : Boolean(l.NgayGo))) &&
        inRange(l.NgayDat, range) &&
        (!normalizedKeyword || [horseById[l.HorseID]?.Ten, l.LyDo].some((text) => text?.toLocaleLowerCase("vi").includes(normalizedKeyword)))
    )
    .sort((a, b) => Boolean(a.NgayGo) - Boolean(b.NgayGo) || (b.NgayGo ?? b.NgayDat).localeCompare(a.NgayGo ?? a.NgayDat));

  const pageCount = Math.max(1, Math.ceil(visibleLocks.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageLocks = visibleLocks.slice(offset, offset + PAGE_SIZE);

  const releaseLock = locks.find((l) => l.LockID === releaseId);
  const viewLock = locks.find((l) => l.LockID === viewId);

  const handleRelease = async ({ status, note }) => {
    const released = await releaseTrainingLock(releaseLock.LockID, status);
    const horseName = horseById[releaseLock.HorseID]?.Ten ?? "ngựa";
    saveLockReleaseNote(released.LockID, note, user.fullName);
    setReleaseNotes(getLockReleaseNotes());
    addAuditLog({
      UserID: currentVetId,
      HanhDong: "Gỡ lệnh khóa huấn luyện",
      TargetTable: "TRAININGLOCK",
      TargetID: released.LockID,
      targetLabel: horseName,
    });
    setLocks((prev) => prev.map((l) => (l.LockID === released.LockID ? released : l)));
    setReleaseId(null);
    setToast({ text: `Đã gỡ khóa huấn luyện cho ${horseName}` });
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Lệnh khóa huấn luyện</h1>
          <p className="mt-1 text-sm text-[#4a3f33]">Ngựa bị khóa không được xếp lịch tập và không thể đăng ký thi đấu cho đến khi gỡ khóa.</p>
        </div>
        <Link to={`/vet/locks/new${horseFilter ? `?horse=${horseFilter}` : ""}`} className="btn-primary">
          + Đặt lệnh khóa
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 text-sm text-[#c0262d]">{loadError}</p>
      ) : (
        <>
          {/* Một hàng: Trạng thái, tìm kiếm, Ngựa, Ngày đặt (+ hai ô ngày khi "Tùy chọn"), Xóa lọc */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <SelectBox id="lockStatus" label="Trạng thái" value={filters.status} onChange={(e) => setFilter({ status: e.target.value })} width="sm:w-40">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectBox>
            <div className="relative w-full sm:w-72">
              <label htmlFor="lockKeyword" className="sr-only">
                Tìm theo tên ngựa, lý do
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
              <input
                id="lockKeyword"
                type="search"
                placeholder="Tìm ngựa, lý do"
                value={filters.keyword}
                onChange={(e) => setFilter({ keyword: e.target.value })}
                className={`${FIELD} pr-3 pl-9 placeholder:text-[#6b6b6b]/70`}
              />
            </div>
            <SelectBox id="lockHorse" label="Lọc theo ngựa" value={horseFilter ?? ""} onChange={(e) => selectHorse(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Tất cả ngựa</option>
              {horses.map((h) => (
                <option key={h.HorseID} value={h.HorseID}>
                  {h.Ten}
                </option>
              ))}
            </SelectBox>
            <SelectBox id="lockPeriod" label="Thời gian theo ngày đặt" value={filters.period} onChange={(e) => setFilter({ period: e.target.value })} width="sm:w-48">
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectBox>
            {filters.period === "custom" && (
              <>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap text-[#6b6b6b]">
                  Từ ngày
                  <DateInput value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter({ from: e.target.value })} className={`${FIELD} w-40 px-2.5`} />
                </label>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap text-[#6b6b6b]">
                  Đến ngày
                  <DateInput value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter({ to: e.target.value })} className={`${FIELD} w-40 px-2.5`} />
                </label>
              </>
            )}
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="cursor-pointer text-sm font-semibold text-[#c2570c] hover:underline">
                Xóa lọc
              </button>
            )}
          </div>
          {rangeError && <p className="mt-2 text-sm text-[#c0262d]">{rangeError}</p>}

          {visibleLocks.length === 0 ? (
            <p className="mt-4 rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">
              {locks.length === 0 ? "Chưa có lệnh khóa nào." : "Không có lệnh khóa nào khớp bộ lọc."}
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white caret-transparent">
              {/* table-layout: fixed + colgroup; tiêu đề và hàng dùng chung một lưới cột, không cuộn ngang */}
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style={{ width: "48px" }} />
                  <col style={{ width: "16%" }} />
                  <col />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "88px" }} />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "112px" }} />
                  <col style={{ width: "88px" }} />
                </colgroup>
                <thead>
                  <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
                    <th className={`${TH} text-center`}>STT</th>
                    <th className={TH}>Ngựa</th>
                    <th className={TH}>Lý do</th>
                    <th className={TH}>Ngày đặt</th>
                    <th className={TH}>Đã khóa</th>
                    <th className={TH}>Ngày gỡ</th>
                    <th className={TH}>Bác sĩ đặt</th>
                    <th className={TH}>Trạng thái</th>
                    <th className={TH}>Xử lý</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {pageLocks.map((lock, i) => (
                    <LockTableRow
                      key={lock.LockID}
                      index={offset + i + 1}
                      lock={lock}
                      horse={horseById[lock.HorseID]}
                      vetName={vetNames[lock.VetID]}
                      onRelease={(l) => setReleaseId(l.LockID)}
                      onView={(l) => setViewId(l.LockID)}
                    />
                  ))}
                </tbody>
              </table>
              <TablePager page={currentPage} pageCount={pageCount} total={visibleLocks.length} pageSize={PAGE_SIZE} unit="lệnh khóa" onPage={setPage} />
            </div>
          )}
        </>
      )}

      {releaseLock && <LockReleaseDialog key={releaseLock.LockID} lock={releaseLock} horse={horseById[releaseLock.HorseID]} onConfirm={handleRelease} onClose={() => setReleaseId(null)} />}

      {viewLock && (
        <LockViewDialog
          key={viewLock.LockID}
          lock={viewLock}
          horse={horseById[viewLock.HorseID]}
          vetName={vetNames[viewLock.VetID]}
          relatedExam={records.find((r) => r.HorseID === viewLock.HorseID && r.Ngay === viewLock.NgayDat)}
          releaseInfo={releaseNotes[viewLock.LockID]}
          onClose={() => setViewId(null)}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
