import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import TablePager from "../../components/TablePager";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import ExamDetailDialog from "./ExamDetailDialog";
import ExamTableRow from "./ExamTableRow";
import { getHorses, getMedicalRecords, getTrainingLocks, getVets } from "../../services/vetService";
import { EXAM_WINDOW_DAYS } from "../../data/medicalRecordOptions";
import { examOutcome } from "../../utils/examOutcome";
import { inRange, periodRange } from "../../utils/dateRange";
import { daysFromToday, todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const PAGE_SIZE = 10;
const TH = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const FIELD = "h-10 w-full rounded-[4px] border border-[#E3E3E3] bg-white text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]";
const OUTCOME_OPTIONS = [
  { value: "", label: "Kết quả: Tất cả" },
  { value: "abnormal", label: "Có bất thường" },
  { value: "normal", label: "Bình thường" },
];
const PERIOD_OPTIONS = [
  { value: "recent", label: `${EXAM_WINDOW_DAYS} ngày gần đây` },
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "all", label: "Tất cả thời gian" },
  { value: "custom", label: "Tùy chọn" },
];
const DEFAULT_FILTERS = { keyword: "", outcome: "", period: "recent", from: "", to: "" };

function SelectBox({ id, label, value, onChange, children, width = "sm:w-48" }) {
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

// Sổ bệnh án của bác sĩ thú y: mỗi lần khám (MEDICALRECORD) 1 hàng bảng, mới nhất trước; bấm "Xem" / cả hàng mở modal chi tiết (phác đồ đầy đủ, lệnh khóa
// liên quan, nút Sửa nếu là người ghi). Cột: STT | Ngày khám | Ngựa | Chẩn đoán | Kết quả khám | Vị trí chấn thương | Bác sĩ khám | Thao tác.
// Lọc: ô tìm (ngựa, chẩn đoán), dropdown Ngựa (?horse=ID trên URL), Kết quả (Có bất thường / Bình thường), Thời gian (mặc định 60 ngày gần đây).
// Form gửi toast sang qua location.state ("Đã lưu bệnh án", kèm liên kết "Xem lệnh khóa" nếu vừa tự động khóa huấn luyện).
export default function MedicalExams() {
  const { user } = useAuth();
  const currentVetId = toUserID(user.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [horses, setHorses] = useState([]);
  const [locks, setLocks] = useState([]);
  const [vetNames, setVetNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null); // RecordID đang mở trong modal chi tiết
  const [toast, setToast] = useState(location.state?.toast ?? null); // { text, link }

  // Đọc xong thông báo từ form thì xóa khỏi history để Back/F5 không hiện lại
  useEffect(() => {
    if (location.state) navigate({ search: location.search }, { replace: true, state: null });
  }, [location.state, location.search, navigate]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getMedicalRecords(), getHorses(), getTrainingLocks(), getVets()])
      .then(([recordList, horseList, lockList, vetList]) => {
        if (ignore) return;
        setRecords(recordList);
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setLocks(lockList);
        setVetNames(Object.fromEntries(vetList.map((v) => [v.UserID, v.HoTen])));
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message || "Không tải được dữ liệu khám bệnh.");
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
    setFilters(DEFAULT_FILTERS);
    setSearchParams({});
    setPage(1);
  };
  const filtersActive = Boolean(horseFilter || filters.keyword || filters.outcome || filters.period !== "recent");
  const rangeError = filters.period === "custom" && filters.from && filters.to && filters.from > filters.to ? "Từ ngày phải trước hoặc bằng Đến ngày." : "";

  // Khoảng thời gian: mặc định 60 ngày gần đây; "Tất cả thời gian" không lọc
  const today = todayISO();
  const range = rangeError
    ? null
    : filters.period === "recent"
      ? { from: daysFromToday(-EXAM_WINDOW_DAYS), to: today }
      : filters.period === "all"
        ? null
        : periodRange(filters.period, today, filters.from, filters.to);

  // Lọc kết hợp AND: ngựa, kết quả, thời gian, từ khóa (tên ngựa / chẩn đoán)
  const normalizedKeyword = filters.keyword.trim().toLocaleLowerCase("vi");
  const visibleRecords = records.filter(
    (r) =>
      (!horseFilter || r.HorseID === horseFilter) &&
      (!filters.outcome || (filters.outcome === "abnormal") === examOutcome(r).abnormal) &&
      inRange(r.Ngay, range) &&
      (!normalizedKeyword || [horseById[r.HorseID]?.Ten, r.ChanDoan].some((text) => text?.toLocaleLowerCase("vi").includes(normalizedKeyword)))
  );

  const pageCount = Math.max(1, Math.ceil(visibleRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageRecords = visibleRecords.slice(offset, offset + PAGE_SIZE);

  const selected = records.find((r) => r.RecordID === selectedId);
  // Lệnh khóa liên quan: đặt cho ngựa này đúng ngày khám
  const relatedLock = selected && locks.find((l) => l.HorseID === selected.HorseID && l.NgayDat === selected.Ngay);

  return (
    <div className="mx-auto w-full max-w-[1280px] md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Khám bệnh</h1>
          <p className="mt-1 text-sm text-[#4a3f33]">Sổ bệnh án các lần khám của ngựa.</p>
        </div>
        <Link
          to={`/vet/exams/new${horseFilter ? `?horse=${horseFilter}` : ""}`}
          className="btn-primary"
        >
          Ghi lần khám
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 text-sm text-[#c0262d]">{loadError}</p>
      ) : (
        <>
          {/* Một hàng: tìm kiếm, Ngựa, Kết quả, Thời gian (+ hai ô ngày khi "Tùy chọn"), Xóa lọc */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <label htmlFor="examKeyword" className="sr-only">
                Tìm theo tên ngựa, chẩn đoán
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
              <input
                id="examKeyword"
                type="search"
                placeholder="Tìm ngựa, chẩn đoán"
                value={filters.keyword}
                onChange={(e) => setFilter({ keyword: e.target.value })}
                className={`${FIELD} pr-3 pl-9 placeholder:text-[#6b6b6b]/70`}
              />
            </div>
            <SelectBox id="examHorse" label="Lọc theo ngựa" value={horseFilter ?? ""} onChange={(e) => selectHorse(e.target.value ? Number(e.target.value) : null)} width="sm:w-44">
              <option value="">Tất cả ngựa</option>
              {horses.map((h) => (
                <option key={h.HorseID} value={h.HorseID}>
                  {h.Ten}
                </option>
              ))}
            </SelectBox>
            <SelectBox id="examOutcome" label="Lọc theo kết quả" value={filters.outcome} onChange={(e) => setFilter({ outcome: e.target.value })} width="sm:w-44">
              {OUTCOME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectBox>
            <SelectBox id="examPeriod" label="Thời gian" value={filters.period} onChange={(e) => setFilter({ period: e.target.value })} width="sm:w-48">
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
                  <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter({ from: e.target.value })} className={`${FIELD} w-40 px-2.5`} />
                </label>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap text-[#6b6b6b]">
                  Đến ngày
                  <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter({ to: e.target.value })} className={`${FIELD} w-40 px-2.5`} />
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

          {visibleRecords.length === 0 ? (
            <p className="mt-4 rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">Không có lần khám nào phù hợp.</p>
          ) : (
            // caret-transparent: không hiện con trỏ chữ trong vùng chỉ đọc (vd khi bật duyệt bằng con trỏ — F7)
            <div className="mt-4 overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white caret-transparent">
              {/* table-layout: fixed + colgroup; tiêu đề và hàng dùng chung một lưới cột, không cuộn ngang */}
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style={{ width: "48px" }} />
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "16%" }} />
                  <col />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "96px" }} />
                </colgroup>
                <thead>
                  <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
                    <th className={`${TH} text-center`}>STT</th>
                    <th className={TH}>Ngày khám</th>
                    <th className={TH}>Ngựa</th>
                    <th className={TH}>Chẩn đoán</th>
                    <th className={TH}>Kết quả khám</th>
                    <th className={TH}>Vị trí chấn thương</th>
                    <th className={TH}>Bác sĩ khám</th>
                    <th className={TH}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {pageRecords.map((record, i) => (
                    <ExamTableRow
                      key={record.RecordID}
                      index={offset + i + 1}
                      record={record}
                      horse={horseById[record.HorseID]}
                      vetName={vetNames[record.VetID]}
                      onSelect={(r) => setSelectedId(r.RecordID)}
                    />
                  ))}
                </tbody>
              </table>
              <TablePager page={currentPage} pageCount={pageCount} total={visibleRecords.length} pageSize={PAGE_SIZE} unit="lần khám" onPage={setPage} />
            </div>
          )}
        </>
      )}

      {selected && (
        <ExamDetailDialog
          key={selected.RecordID}
          record={selected}
          horse={horseById[selected.HorseID]}
          vetName={vetNames[selected.VetID]}
          lock={relatedLock}
          canEdit={selected.VetID === currentVetId}
          onClose={() => setSelectedId(null)}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
