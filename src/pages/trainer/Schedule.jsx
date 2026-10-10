import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import ScheduleWeekGrid from "./ScheduleWeekGrid";
import { getActiveTrainingLocks, getGrooms, getHorses, getSchedules } from "../../services/trainerService";
import { addDays, formatDayMonth, startOfWeek, todayISO } from "../../utils/date";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NAV_BUTTON =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-stone/25 bg-white text-ink transition-colors hover:border-stone/40";
const VIEW_MODES = [
  { value: "horse", label: "Theo ngựa" },
  { value: "groom", label: "Theo nhân viên" },
];

// Lịch tập dạng lưới tuần (bảng xếp ca): hàng = ngựa hoặc nhân viên chăm sóc, cột = T2 → CN.
// Tuần đang xem (?week=<Thứ Hai>) và chế độ xem (?view=groom) nằm trên URL để quay lại từ form vẫn đúng.
export default function Schedule() {
  const { state } = useLocation(); // thông báo do form gửi sang
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayISO();
  const currentWeekStart = startOfWeek(today);
  const weekParam = searchParams.get("week");
  const weekStart = weekParam && DATE_PATTERN.test(weekParam) ? startOfWeek(weekParam) : currentWeekStart;
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const mode = searchParams.get("view") === "groom" ? "groom" : "horse";

  const [schedules, setSchedules] = useState([]);
  const [horses, setHorses] = useState([]);
  const [grooms, setGrooms] = useState([]);
  const [lockedHorseIds, setLockedHorseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState(state?.message ?? "");

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getSchedules(), getHorses(), getGrooms(), getActiveTrainingLocks()]).then(
      ([scheduleList, horseList, groomList, lockList]) => {
        if (ignore) return;
        setSchedules(scheduleList);
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setGrooms([...groomList].sort((a, b) => a.HoTen.localeCompare(b.HoTen, "vi")));
        setLockedHorseIds(new Set(lockList.map((l) => l.HorseID)));
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  const updateParams = (changes) => {
    const next = { week: weekStart, view: mode, ...changes };
    const params = {};
    if (next.week !== currentWeekStart) params.week = next.week;
    if (next.view === "groom") params.view = "groom";
    setSearchParams(params);
  };

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const groomNameById = Object.fromEntries(grooms.map((g) => [g.UserID, g.HoTen]));

  // Buổi trong tuần, lọc theo tên ngựa (ở cả 2 chế độ)
  const normalizedKeyword = keyword.trim().toLowerCase();
  const weekSchedules = schedules
    .filter(
      (s) =>
        s.Ngay >= weekDays[0] &&
        s.Ngay <= weekDays[6] &&
        (horseById[s.HorseID]?.Ten ?? "").toLowerCase().includes(normalizedKeyword)
    )
    .sort((a, b) => a.Gio.localeCompare(b.Gio));

  // Hàng của lưới. Theo ngựa: ngựa khớp ô tìm kiếm. Theo nhân viên: người đang hoạt động + người có buổi trong tuần.
  const rows =
    mode === "horse"
      ? horses
          .filter((h) => h.Ten.toLowerCase().includes(normalizedKeyword))
          .map((h) => ({
            key: `horse-${h.HorseID}`,
            kind: "horse",
            entity: h,
            isLocked: lockedHorseIds.has(h.HorseID),
            count: weekSchedules.filter((s) => s.HorseID === h.HorseID).length,
          }))
      : grooms
          .filter((g) => g.isActive || weekSchedules.some((s) => s.GroomID === g.UserID))
          .map((g) => ({
            key: `groom-${g.UserID}`,
            kind: "groom",
            entity: g,
            isLocked: false,
            count: weekSchedules.filter((s) => s.GroomID === g.UserID).length,
          }));

  // Gom buổi vào ô "<hàng>|<ngày>"
  const schedulesByCell = weekSchedules.reduce((acc, s) => {
    const key = `${mode === "horse" ? `horse-${s.HorseID}` : `groom-${s.GroomID}`}|${s.Ngay}`;
    return { ...acc, [key]: [...(acc[key] ?? []), s] };
  }, {});

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Lịch tập</h1>
          {/* Điều hướng tuần: ‹ khoảng ngày › */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => updateParams({ week: addDays(weekStart, -7) })} aria-label="Tuần trước" className={NAV_BUTTON}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-[7.5rem] text-center text-sm font-medium text-ink tabular-nums">
              {formatDayMonth(weekDays[0])} – {formatDayMonth(weekDays[6])}
            </span>
            <button type="button" onClick={() => updateParams({ week: addDays(weekStart, 7) })} aria-label="Tuần sau" className={NAV_BUTTON}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {weekStart !== currentWeekStart && (
              <button
                type="button"
                onClick={() => updateParams({ week: currentWeekStart })}
                className="ml-1 cursor-pointer text-sm font-medium text-brass-deep underline-offset-2 hover:underline"
              >
                Về tuần này
              </button>
            )}
          </div>
        </div>
        <Link
          to="/trainer/schedule/new"
          className="rounded-sm bg-brass px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brass/85"
        >
          + Xếp lịch tập
        </Link>
      </div>

      {message && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-sm border-l-2 border-green-700 bg-white/60 px-4 py-3 text-sm text-green-800">
          {message}
          <button type="button" onClick={() => setMessage("")} className="cursor-pointer font-semibold text-green-700 hover:underline">
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Công tắc 2 nút chọn chế độ xem — cùng màu pill đang chọn */}
            <div role="radiogroup" aria-label="Chế độ xem" className="inline-flex rounded-full border border-stone/25 bg-white p-0.5">
              {VIEW_MODES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={mode === option.value}
                  onClick={() => updateParams({ view: option.value })}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    mode === option.value ? "bg-brass/15 font-medium text-brass-deep" : "text-ink hover:bg-black/[0.03]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <label htmlFor="scheduleKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" />
              <input
                id="scheduleKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>
          </div>

          {/* Chú giải màu chip — dùng đúng 2 kiểu chip trong lưới */}
          <p className="-mt-1 text-xs text-stone">Xám: đã diễn ra · Viền cam: sắp tới</p>

          {rows.length === 0 ? (
            <div className="border-y border-stone/20 py-16 text-center text-stone">
              <SearchX className="mx-auto mb-3 h-10 w-10 text-stone/40" />
              Không tìm thấy ngựa phù hợp
            </div>
          ) : (
            <ScheduleWeekGrid
              mode={mode}
              rows={rows}
              weekDays={weekDays}
              today={today}
              schedulesByCell={schedulesByCell}
              horseById={horseById}
              groomNameById={groomNameById}
            />
          )}
        </div>
      )}
    </div>
  );
}
