import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import TablePager from "../../components/TablePager";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import useMediaQuery from "../../hooks/useMediaQuery";
import MarkVaccinatedDialog from "./MarkVaccinatedDialog";
import VaccinationCellDialog from "./VaccinationCellDialog";
import VaccinationMatrix from "./VaccinationMatrix";
import VaccinationRow from "./VaccinationRow";
import { getHorses, getVaccinations, markVaccinated } from "../../services/vetService";
import { addAuditLog } from "../../services/auditService";
import { getVaccineState } from "../../utils/healthAlerts";
import { addDays, todayISO } from "../../utils/date";
import { inRange, periodRange } from "../../utils/dateRange";
import { getCellRepresentative, getVaccineColumns } from "../../utils/vaccinationMatrix";
import { toUserID } from "../../utils/userId";
import DateInput from "../../components/DateInput";

const PAGE_SIZE = 10;
const VIEW_MODES = [
  { value: "matrix", label: "Tổng hợp" },
  { value: "list", label: "Danh sách mũi tiêm" },
];
const STATUS_OPTIONS = [
  { value: "", label: "Trạng thái: Tất cả" },
  { value: "overdue", label: "Có quá hạn" },
  { value: "soon", label: "Sắp đến hạn" },
  { value: "none", label: "Chưa có lịch" },
];
const PERIOD_OPTIONS = [
  { value: "all", label: "Ngày hẹn: Tất cả" },
  { value: "next7", label: "7 ngày tới" },
  { value: "next30", label: "30 ngày tới" },
  { value: "overdue", label: "Quá hạn" },
  { value: "custom", label: "Tùy chọn" },
];
const EMPTY_FILTERS = { keyword: "", status: "", period: "all", from: "", to: "" };
const FIELD = "h-10 w-full rounded-[4px] border border-[#E3E3E3] bg-white text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]";
const TH = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

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

// Hàng cần chú ý trước: có quá hạn → có sắp tới → còn lại
const rowRank = (cells) => (cells.some((c) => c?.state === "Quá hạn") ? 0 : cells.some((c) => c?.state === "Sắp tới") ? 1 : 2);

// Lịch tiêm phòng / tẩy giun (VACCINATIONSCHEDULE) của bác sĩ thú y, 2 chế độ xem (bảng trung tính, bộ lọc dùng chung):
// - Ma trận (mặc định): ngựa × loại, mỗi ô 1 lịch đại diện; bấm ô mở modal lịch sử.
// - Danh sách: nhóm Quá hạn → Sắp tới (gồm chờ tiêm xa) → Đã tiêm.
// ?horse=ID đặt dropdown Ngựa và lọc cả hai chế độ chỉ còn ngựa đó.
// Màn hẹp (<900px) luôn dùng Danh sách. Trạng thái hiển thị tính bằng getVaccineState (dữ liệu chỉ lưu "Chờ tiêm" | "Đã tiêm").
// Lọc: tìm ngựa, dropdown Ngựa, Trạng thái (Có quá hạn / Sắp đến hạn / Chưa có lịch), Thời gian (theo ngày hẹn).
export default function Vaccinations() {
  const { user } = useAuth();
  const currentVetId = toUserID(user.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayISO();

  const [items, setItems] = useState([]);
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState("matrix"); // "matrix" | "list" — chỉ giữ trong state của trang
  const [openCell, setOpenCell] = useState(null); // { horseId, type } ô ma trận đang mở modal
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [listPage, setListPage] = useState(1);
  const [marking, setMarking] = useState(null); // lịch đang mở hộp "Ghi mũi tiêm"
  const [markLoading, setMarkLoading] = useState(false);
  const [markError, setMarkError] = useState("");
  const [toast, setToast] = useState(location.state?.toast ?? null);

  // Đọc xong thông báo từ form thì xóa khỏi history để Back/F5 không hiện lại
  useEffect(() => {
    if (location.state) navigate({ search: location.search }, { replace: true, state: null });
  }, [location.state, location.search, navigate]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getVaccinations(), getHorses()])
      .then(([itemList, horseList]) => {
        if (ignore) return;
        setItems(itemList);
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message || "Không tải được lịch tiêm phòng.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const closeToast = useCallback(() => setToast(null), []);
  const isNarrow = useMediaQuery("(max-width: 899px)");
  const effectiveView = isNarrow ? "list" : view;

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const horseFilter = horseById[searchParams.get("horse")] ? Number(searchParams.get("horse")) : null;
  // ?horse=ID đặt luôn dropdown Ngựa và lọc bảng chỉ còn ngựa đó (cả Ma trận lẫn Danh sách)
  const setFilter = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setListPage(1);
  };
  const selectHorse = (horseId) => {
    setSearchParams(horseId ? { horse: horseId } : {});
    setListPage(1);
  };
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchParams({});
    setListPage(1);
  };
  const filtersActive = Boolean(horseFilter || filters.keyword || filters.status || filters.period !== "all");
  const rangeError = filters.period === "custom" && filters.from && filters.to && filters.from > filters.to ? "Từ ngày phải trước hoặc bằng Đến ngày." : "";

  // Lọc "Thời gian" theo NgayHen của lịch (item) và trạng thái hiển thị của nó
  const customRange = rangeError ? null : periodRange("custom", today, filters.from, filters.to);
  const matchesPeriod = (item, state) => {
    switch (filters.period) {
      case "next7":
        return item.NgayHen >= today && item.NgayHen <= addDays(today, 7);
      case "next30":
        return item.NgayHen >= today && item.NgayHen <= addDays(today, 30);
      case "overdue":
        return state === "Quá hạn";
      case "custom":
        return inRange(item.NgayHen, customRange);
      default:
        return true;
    }
  };
  const normalizedKeyword = filters.keyword.trim().toLocaleLowerCase("vi");
  const horseMatches = (horse) =>
    (!horseFilter || horse.HorseID === horseFilter) &&
    (!normalizedKeyword || horse.Ten.toLocaleLowerCase("vi").includes(normalizedKeyword));

  // ---- Ma trận ----
  const columns = getVaccineColumns(items);
  const matrixRows = horses
    .filter(horseMatches)
    .map((horse) => ({
      horse,
      cells: columns.map((type) => getCellRepresentative(items.filter((v) => v.HorseID === horse.HorseID && v.Loai === type), today)),
    }))
    .filter(({ cells }) => {
      if (filters.status === "overdue" && !cells.some((c) => c?.state === "Quá hạn")) return false;
      if (filters.status === "soon" && !cells.some((c) => c?.state === "Sắp tới")) return false;
      if (filters.status === "none" && !cells.some((c) => !c)) return false;
      if (filters.period !== "all" && !cells.some((c) => c && matchesPeriod(c.item, c.state))) return false;
      return true;
    })
    .sort((a, b) => rowRank(a.cells) - rowRank(b.cells) || a.horse.Ten.localeCompare(b.horse.Ten, "vi"));

  // ---- Danh sách ----
  const withState = items.map((item) => ({ item, state: getVaccineState(item, today) }));
  const listVisible = withState.filter(
    ({ item, state }) =>
      horseById[item.HorseID] &&
      horseMatches(horseById[item.HorseID]) &&
      (!filters.status ||
        (filters.status === "overdue" && state === "Quá hạn") ||
        (filters.status === "soon" && state === "Sắp tới")) &&
      matchesPeriod(item, state)
  );
  // Nhóm: quá hạn (NgayHen cũ nhất trước), sắp tới + chờ tiêm (gần nhất trước), đã tiêm (mới nhất trước)
  const byDateAsc = (a, b) => a.item.NgayHen.localeCompare(b.item.NgayHen);
  const listRows = [
    ...listVisible.filter((r) => r.state === "Quá hạn").sort(byDateAsc),
    ...listVisible.filter((r) => r.state === "Sắp tới" || r.state === "Chờ tiêm").sort(byDateAsc),
    ...listVisible.filter((r) => r.state === "Đã tiêm").sort((a, b) => -byDateAsc(a, b)),
  ];
  const listPageCount = Math.max(1, Math.ceil(listRows.length / PAGE_SIZE));
  const currentListPage = Math.min(listPage, listPageCount);
  const listOffset = (currentListPage - 1) * PAGE_SIZE;

  const handleMarkDone = async (nextDate) => {
    setMarkLoading(true);
    setMarkError("");
    try {
      const { item, next } = await markVaccinated(marking.ScheduleID, nextDate);
      const horseName = horseById[item.HorseID]?.Ten ?? "ngựa";
      addAuditLog({
        UserID: currentVetId,
        HanhDong: `Ghi nhận tiêm ${item.Loai}`,
        TargetTable: "VACCINATIONSCHEDULE",
        TargetID: item.ScheduleID,
        targetLabel: horseName,
      });
      setItems((prev) => [...prev.map((v) => (v.ScheduleID === item.ScheduleID ? item : v)), ...(next ? [next] : [])]);
      setMarking(null);
      setToast({ text: `Đã ghi nhận tiêm ${item.Loai} cho ${horseName}` });
    } catch (err) {
      setMarkError(err.message);
    } finally {
      setMarkLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Lịch tiêm phòng</h1>
        <Link to={`/vet/vaccinations/new${horseFilter ? `?horse=${horseFilter}` : ""}`} className="btn-primary">
          + Thêm lịch
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 text-sm text-[#c0262d]">{loadError}</p>
      ) : (
        <>
          {/* Tab chế độ xem (gạch chân cam), ẩn ở màn hẹp vì luôn là Danh sách */}
          {!isNarrow && (
            <div role="radiogroup" aria-label="Chế độ xem" className="mt-5 flex gap-x-6 border-b border-[#E3E3E3]">
              {VIEW_MODES.map((option) => {
                const active = view === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setView(option.value)}
                    className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm text-[#1f1f1f] transition-colors ${FOCUS_RING} ${
                      active ? "border-[#c2570c] font-semibold" : "border-transparent font-medium hover:border-[#E3E3E3]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Một hàng lọc: tìm ngựa, Ngựa, Trạng thái, Ngày hẹn (+ hai ô ngày khi "Tùy chọn"), Xóa lọc */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <label htmlFor="vaccineKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
              <input
                id="vaccineKeyword"
                type="search"
                placeholder="Tìm ngựa"
                value={filters.keyword}
                onChange={(e) => setFilter({ keyword: e.target.value })}
                className={`${FIELD} pr-3 pl-9 placeholder:text-[#6b6b6b]/70`}
              />
            </div>
            <SelectBox id="vaccineHorse" label="Lọc theo ngựa" value={horseFilter ?? ""} onChange={(e) => selectHorse(e.target.value ? Number(e.target.value) : null)} width="sm:w-44">
              <option value="">Tất cả ngựa</option>
              {horses.map((h) => (
                <option key={h.HorseID} value={h.HorseID}>
                  {h.Ten}
                </option>
              ))}
            </SelectBox>
            <SelectBox id="vaccineStatus" label="Trạng thái" value={filters.status} onChange={(e) => setFilter({ status: e.target.value })}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectBox>
            <SelectBox id="vaccinePeriod" label="Thời gian theo ngày hẹn" value={filters.period} onChange={(e) => setFilter({ period: e.target.value })}>
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

          {effectiveView === "matrix" ? (
            <VaccinationMatrix
              rows={matrixRows}
              columns={columns}
              today={today}
              onOpenCell={(horse, type) => setOpenCell({ horseId: horse.HorseID, type })}
            />
          ) : listRows.length === 0 ? (
            <p className="mt-4 rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">Không có lịch tiêm nào khớp bộ lọc.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style={{ width: "48px" }} />
                  <col style={{ width: "22%" }} />
                  <col />
                  <col style={{ width: "118px" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "190px" }} />
                </colgroup>
                <thead>
                  <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
                    <th className={`${TH} text-center`}>STT</th>
                    <th className={TH}>Ngựa</th>
                    <th className={TH}>Loại</th>
                    <th className={TH}>Ngày hẹn</th>
                    <th className={TH}>Thời hạn</th>
                    <th className={TH}>Xử lý</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {listRows.slice(listOffset, listOffset + PAGE_SIZE).map(({ item, state }, i) => (
                    <VaccinationRow key={item.ScheduleID} index={listOffset + i + 1} item={item} state={state} horse={horseById[item.HorseID]} onMarkDone={setMarking} />
                  ))}
                </tbody>
              </table>
              <TablePager page={currentListPage} pageCount={listPageCount} total={listRows.length} pageSize={PAGE_SIZE} unit="lịch tiêm" onPage={setListPage} />
            </div>
          )}
        </>
      )}

      {openCell && horseById[openCell.horseId] && (
        <VaccinationCellDialog
          key={`${openCell.horseId}-${openCell.type}`}
          horse={horseById[openCell.horseId]}
          type={openCell.type}
          items={items.filter((v) => v.HorseID === openCell.horseId && v.Loai === openCell.type)}
          blocked={Boolean(marking)}
          onMarkDone={setMarking}
          onClose={() => setOpenCell(null)}
        />
      )}

      {marking && (
        <MarkVaccinatedDialog
          item={marking}
          horseName={horseById[marking.HorseID]?.Ten ?? "ngựa"}
          loading={markLoading}
          error={markError}
          onConfirm={handleMarkDone}
          onCancel={() => {
            setMarking(null);
            setMarkError("");
          }}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
