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
import HorseSelect from "./HorseSelect";
import VaccinationRow, { VACCINE_GRID } from "./VaccinationRow";
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
const HEAD_CELL = "text-xs font-medium tracking-wide text-stone uppercase";
const GROUP_TITLE =
  "border-b border-stone/15 pt-5 pb-1.5 pl-3 text-xs font-medium tracking-wide text-stone uppercase select-none";

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

  return (
    <div>
      {/* Tiêu đề + công tắc chế độ xem (chữ, viền hairline; ẩn ở màn hẹp vì luôn là Danh sách) */}
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
          Lịch tiêm phòng
        </h1>
        {!isNarrow && (
          <div
            role="radiogroup"
            aria-label="Chế độ xem"
            className="inline-flex rounded-md border border-stone/25 bg-white p-0.5"
          >
            {VIEW_MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={view === option.value}
                onClick={() => setView(option.value)}
                className={`cursor-pointer rounded px-3 py-1 text-sm transition-colors ${
                  view === option.value
                    ? "bg-track font-medium text-bark"
                    : "text-stone hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {/* Chip trạng thái chỉ dùng cho Danh sách (ma trận đã thể hiện trạng thái bằng ô) */}
            {effectiveView === "list" && (
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Lọc theo trạng thái"
              >
                {STATUS_FILTERS.map((f) => {
                  const active = statusFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusFilter(f.value)}
                      className={`h-9 cursor-pointer rounded-full border px-3.5 text-sm transition-colors ${
                        active
                          ? "border-brass bg-brass/15 font-medium text-brass-deep"
                          : "border-stone/25 bg-white text-ink hover:border-stone/40"
                      }`}
                    >
                      {f.value === "action"
                        ? `${f.label} · ${actionCount}`
                        : f.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="relative w-full sm:w-64">
              <label htmlFor="vaccineKeyword" className="sr-only">
                Tìm theo tên ngựa, loại
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone"
                aria-hidden="true"
              />
              <input
                id="vaccineKeyword"
                type="search"
                placeholder="Tìm ngựa, loại..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-full border border-stone/20 bg-white pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>
            <HorseSelect
              horses={horses}
              value={dropdownHorse}
              onChange={selectHorse}
            />
            <Link
              to={`/vet/vaccinations/new${horseFilter ? `?horse=${horseFilter}` : ""}`}
              className="btn-primary ml-auto"
            >
              + Thêm lịch
            </Link>
          </div>
          {effectiveView === "matrix" ? (
            <VaccinationMatrix
              horses={horses}
              items={items}
              keyword={keyword}
              highlightHorseId={horseFilter}
              today={today}
              onOpenCell={(horse, type) =>
                setOpenCell({ horseId: horse.HorseID, type })
              }
            />
          ) : (
            <>
              <p className="mt-2 text-[13px] text-stone">
                {pendingCount} lịch đang chờ tiêm
              </p>

              {groups.length === 0 ? (
                <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">
                  Không có lịch tiêm nào khớp bộ lọc.{" "}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="cursor-pointer font-medium text-brass-deep underline-offset-2 hover:underline"
                  >
                    Xóa bộ lọc
                  </button>
                </p>
              ) : (
                <div className="mt-5 caret-transparent">
                  <div
                    aria-hidden="true"
                    className={`border-b border-stone/20 pr-2 pb-2 pl-3 ${VACCINE_GRID}`}
                  >
                    <span className={HEAD_CELL}>
                      Ngựa<span className="min-[900px]:hidden"> · loại</span>
                    </span>
                    <span className={`hidden min-[900px]:block ${HEAD_CELL}`}>
                      Loại
                    </span>
                    <span
                      className={`text-right min-[900px]:text-left ${HEAD_CELL}`}
                    >
                      Ngày hẹn
                    </span>
                    <span className={`hidden min-[900px]:block ${HEAD_CELL}`}>
                      Thời hạn
                    </span>
                    <span
                      className={`hidden text-right min-[900px]:block ${HEAD_CELL}`}
                    >
                      Hành động
                    </span>
                  </div>
                  {groups.map((group) => (
                    <section
                      key={group.key}
                      aria-label={`${group.title} · ${group.rows.length}`}
                    >
                      <h2 className={GROUP_TITLE}>
                        {group.title} · {group.rows.length}
                      </h2>
                      <ul>
                        {group.rows.map(({ item, state }) => (
                          <VaccinationRow
                            key={item.ScheduleID}
                            item={item}
                            state={state}
                            horse={horseById[item.HorseID]}
                            onMarkDone={setMarking}
                          />
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
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
