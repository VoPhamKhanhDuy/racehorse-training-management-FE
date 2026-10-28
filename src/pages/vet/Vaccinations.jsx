import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import useMediaQuery from "../../hooks/useMediaQuery";
import VaccinationLegend from "./VaccinationLegend";
import VaccinationRow from "./VaccinationRow";
import MarkVaccinatedDialog from "./MarkVaccinatedDialog";
import VaccinationMatrix from "./VaccinationMatrix";
import VaccinationCellDrawer from "./VaccinationCellDrawer";
import {
  getHorses,
  getVaccinations,
  markVaccinated,
} from "../../services/vetService";
import { addAuditLog } from "../../services/auditService";
import { getVaccineState } from "../../utils/healthAlerts";
import { todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "action", label: "Cần xử lý" }, // quá hạn + sắp tới
  { value: "done", label: "Đã tiêm" },
];
const VIEW_MODES = [
  { value: "matrix", label: "Ma trận" },
  { value: "list", label: "Danh sách" },
];
const HEAD = "border-b border-[#b9ab90] bg-[#4a3a2a] px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-[#f3ede0]";
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

// Lịch tiêm phòng / tẩy giun (VACCINATIONSCHEDULE) của bác sĩ thú y, 2 chế độ xem:
// - Ma trận (mặc định): ngựa × loại, mỗi ô 1 lịch đại diện; bấm ô mở ngăn lịch sử. ?horse=ID làm nổi hàng, không ẩn hàng khác.
// - Danh sách: nhóm Quá hạn → Sắp tới (gồm chờ tiêm xa) → Đã tiêm; ?horse=ID lọc 1 ngựa.
// Màn hẹp (<900px) luôn dùng Danh sách. Trạng thái hiển thị tính bằng getVaccineState (dữ liệu chỉ lưu "Chờ tiêm" | "Đã tiêm").
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
  const [view, setView] = useState("matrix"); // "matrix" | "list" — chỉ giữ trong state của trang
  const [openCell, setOpenCell] = useState(null); // { horseId, type } ô ma trận đang mở ngăn chi tiết
  const [statusFilter, setStatusFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [marking, setMarking] = useState(null); // lịch đang mở hộp "Đã tiêm"
  const [markLoading, setMarkLoading] = useState(false);
  const [markError, setMarkError] = useState("");
  const [toast, setToast] = useState(location.state?.toast ?? null);

  // Đọc xong thông báo từ form thì xóa khỏi history để Back/F5 không hiện lại
  useEffect(() => {
    if (location.state)
      navigate({ search: location.search }, { replace: true, state: null });
  }, [location.state, location.search, navigate]);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock vetService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getVaccinations(), getHorses()]).then(
      ([itemList, horseList]) => {
        if (ignore) return;
        setItems(itemList);
        setHorses(
          [...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")),
        );
        setLoading(false);
      },
    );
    return () => {
      ignore = true;
    };
  }, []);

  const closeToast = useCallback(() => setToast(null), []);
  const isNarrow = useMediaQuery("(max-width: 899px)");
  const effectiveView = isNarrow ? "list" : view;
  // Hộp "Đã tiêm" đang mở thì Esc chỉ đóng hộp, không đóng ngăn ô phía sau (ref để closeCell không đổi)
  const markingRef = useRef(null);
  useEffect(() => {
    markingRef.current = marking;
  }, [marking]);
  const closeCell = useCallback(() => {
    if (!markingRef.current) setOpenCell(null);
  }, []);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const horseFilter = horseById[searchParams.get("horse")]
    ? Number(searchParams.get("horse"))
    : null;
  // Ngựa do người dùng tự chọn ở dropdown (khác với ?horse=ID đến từ liên kết trang khác)
  const [pickedHorse, setPickedHorse] = useState(false);
  const selectHorse = (horseId) => {
    setPickedHorse(Boolean(horseId));
    setSearchParams(horseId ? { horse: horseId } : {});
  };
  // Ma trận: ?horse=ID từ liên kết chỉ đánh dấu hàng, dropdown vẫn "Tất cả ngựa" trừ khi người dùng tự chọn
  const dropdownHorse = effectiveView === "matrix" && !pickedHorse ? null : horseFilter;
  const clearFilters = () => {
    setKeyword("");
    setStatusFilter("all");
    setPickedHorse(false);
    setSearchParams({});
  };

  // Danh sách: lọc ngựa + từ khóa (tên ngựa / loại) trước; chip trạng thái lọc sau để đếm "Cần xử lý · N" theo bộ lọc
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");
  const withState = items.map((item) => ({
    item,
    state: getVaccineState(item, today),
  }));
  const base = withState.filter(
    ({ item }) =>
      (!horseFilter || item.HorseID === horseFilter) &&
      (!normalizedKeyword ||
        [horseById[item.HorseID]?.Ten, item.Loai].some((text) =>
          text?.toLocaleLowerCase("vi").includes(normalizedKeyword),
        )),
  );
  const needsAction = ({ state }) => state === "Quá hạn" || state === "Sắp tới";
  const actionCount = base.filter(needsAction).length;
  const visible = base.filter(
    (row) =>
      statusFilter === "all" ||
      (statusFilter === "action" ? needsAction(row) : row.state === "Đã tiêm"),
  );
  const pendingCount = visible.filter(
    ({ item }) => item.TrangThai === "Chờ tiêm",
  ).length;

  // Nhóm: quá hạn (NgayHen cũ nhất trước), sắp tới + chờ tiêm (gần nhất trước), đã tiêm (mới nhất trước)
  const byDateAsc = (a, b) => a.item.NgayHen.localeCompare(b.item.NgayHen);
  const groups = [
    {
      key: "overdue",
      title: "Quá hạn",
      rows: visible.filter((r) => r.state === "Quá hạn").sort(byDateAsc),
    },
    {
      key: "upcoming",
      title: "Sắp tới",
      rows: visible
        .filter((r) => r.state === "Sắp tới" || r.state === "Chờ tiêm")
        .sort(byDateAsc),
    },
    {
      key: "done",
      title: "Đã tiêm",
      rows: visible
        .filter((r) => r.state === "Đã tiêm")
        .sort((a, b) => -byDateAsc(a, b)),
    },
  ].filter((g) => g.rows.length > 0);

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
      setItems((prev) => [
        ...prev.map((v) => (v.ScheduleID === item.ScheduleID ? item : v)),
        ...(next ? [next] : []),
      ]);
      setMarking(null);
      setToast({ text: `Đã ghi nhận tiêm ${item.Loai} cho ${horseName}` });
    } catch (err) {
      setMarkError(err.message);
    } finally {
      setMarkLoading(false);
    }
  };

  // Danh sách phẳng giữ nguyên thứ tự các nhóm (Quá hạn → Sắp tới → Đã tiêm)
  const listRows = groups.flatMap((g) => g.rows);

  return (
    <div className="mx-auto w-full max-w-[1280px] md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Lịch tiêm phòng</h1>
        <Link
          to={`/vet/vaccinations/new${horseFilter ? `?horse=${horseFilter}` : ""}`}
          className={`inline-flex h-10 items-center rounded-[4px] bg-[#c2570c] px-5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#a8480a] ${FOCUS_RING}`}
        >
          + Thêm lịch
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Thanh công cụ: tìm kiếm + chọn ngựa bên trái; chế độ xem (tab chữ) bên phải, ẩn ở màn hẹp vì luôn là Danh sách */}
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[#d9cfba]">
            <div className="mb-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative w-full sm:w-[280px]">
                <label htmlFor="vaccineKeyword" className="sr-only">
                  Tìm theo tên ngựa, loại
                </label>
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" aria-hidden="true" />
                <input
                  id="vaccineKeyword"
                  type="search"
                  placeholder="Tìm ngựa, loại..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-9 w-full rounded-[4px] border border-[#cfc4ad] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none placeholder:text-[#6b6055]/70 focus:border-[#c2570c]"
                />
              </div>
              <label htmlFor="vaccineHorse" className="sr-only">
                Lọc theo ngựa
              </label>
              <select
                id="vaccineHorse"
                value={dropdownHorse ?? ""}
                onChange={(e) => selectHorse(e.target.value ? Number(e.target.value) : null)}
                className="h-9 w-full cursor-pointer rounded-[4px] border border-[#cfc4ad] bg-white px-3 text-sm text-[#2b2118] outline-none focus:border-[#c2570c] sm:w-48"
              >
                <option value="">Tất cả ngựa</option>
                {horses.map((h) => (
                  <option key={h.HorseID} value={h.HorseID}>
                    {h.Ten}
                  </option>
                ))}
              </select>
            </div>

            {!isNarrow && (
              <div role="radiogroup" aria-label="Chế độ xem" className="flex gap-x-6">
                {VIEW_MODES.map((option) => {
                  const active = view === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setView(option.value)}
                      className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm transition-colors ${FOCUS_RING} ${
                        active ? "border-[#c2570c] font-semibold text-[#2b2118]" : "border-transparent text-[#4a3f33] hover:text-[#2b2118]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lọc trạng thái chỉ dùng cho Danh sách (ma trận đã thể hiện trạng thái bằng ô) */}
          {effectiveView === "list" && (
            <div className="mt-4 flex flex-wrap gap-x-6 border-b border-[#d9cfba]" role="group" aria-label="Lọc theo trạng thái">
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatusFilter(f.value)}
                    className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm transition-colors ${FOCUS_RING} ${
                      active ? "border-[#c2570c] font-semibold text-[#2b2118]" : "border-transparent text-[#4a3f33] hover:text-[#2b2118]"
                    }`}
                  >
                    {f.value === "action" ? `${f.label} · ${actionCount}` : f.label}
                  </button>
                );
              })}
            </div>
          )}

          {effectiveView === "matrix" ? (
            <VaccinationMatrix
              horses={horses}
              items={items}
              keyword={keyword}
              highlightHorseId={horseFilter}
              today={today}
              onOpenCell={(horse, type) => setOpenCell({ horseId: horse.HorseID, type })}
            />
          ) : (
            <>
              <p className="mt-3 text-sm text-[#4a3f33]">{pendingCount} lịch đang chờ tiêm</p>

              {listRows.length === 0 ? (
                <p className="mt-4 rounded-[4px] border border-[#d9cfba] bg-white py-12 text-center text-sm text-[#4a3f33]">
                  Không có lịch tiêm nào khớp bộ lọc.{" "}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`cursor-pointer font-semibold text-[#c2570c] underline-offset-2 hover:underline ${FOCUS_RING}`}
                  >
                    Xóa bộ lọc
                  </button>
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white">
                  <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr>
                        <th className={HEAD}>Ngựa</th>
                        <th className={HEAD}>Loại</th>
                        <th className={HEAD}>Ngày hẹn</th>
                        <th className={HEAD}>Thời hạn</th>
                        <th className={`${HEAD} text-right`}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr:last-child>td]:border-b-0">
                      {listRows.map(({ item, state }) => (
                        <VaccinationRow
                          key={item.ScheduleID}
                          item={item}
                          state={state}
                          horse={horseById[item.HorseID]}
                          onMarkDone={setMarking}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <VaccinationLegend />
            </>
          )}
        </>
      )}

      {openCell && horseById[openCell.horseId] && (
        <VaccinationCellDrawer
          horse={horseById[openCell.horseId]}
          type={openCell.type}
          items={items.filter(
            (v) => v.HorseID === openCell.horseId && v.Loai === openCell.type,
          )}
          onMarkDone={setMarking}
          onClose={closeCell}
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
