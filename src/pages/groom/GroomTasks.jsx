import { useCallback, useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import CareTaskRow from "./CareTaskRow";
import NextTaskBanner from "./NextTaskBanner";
import { completeCareTask, getCareTasks, getHorses, getStableNumbers } from "../../services/careService";
import { addAuditLog } from "../../services/auditService";
import { CARE_SHIFTS, CARE_TASK_SCHEDULE, CARE_WORK_WINDOW, getTaskTime, toMinutes } from "../../config/careTaskSchedule";
import { addDays, formatDate, formatDayMonth, todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const GROUP_TITLE = "border-b border-stone/20 pb-1.5 text-xs font-medium tracking-wide text-stone uppercase";
const VIEWS = [
  { id: "all", label: "Tất cả" },
  { id: "done", label: "Đã xong" },
  { id: "open", label: "Chưa xong" },
];

const chipClass = (active) =>
  `h-9 cursor-pointer rounded-full border px-3.5 text-sm transition-colors ${
    active ? "border-brass bg-brass/15 font-medium text-brass-deep" : "border-stone/25 bg-white text-ink hover:border-stone/40"
  }`;

// Số phút từ 0h của thời điểm hiện tại
const currentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// "Phiếu việc trong ngày" của nhân viên chăm sóc: ô "Việc tiếp theo" trỏ tới việc chưa xong sớm nhất,
// danh sách bên dưới vẫn giữ đủ mọi việc. Bấm xác nhận chỉ đổi đúng việc đó sang "Đã xong".
// Giờ lấy từ việc (Gio); loại việc có trong careTaskSchedule.js thì dùng giờ chuẩn của loại đó.
export default function GroomTasks() {
  const { user } = useAuth();
  const groomId = toUserID(user.id);
  const today = todayISO();
  const yesterday = addDays(today, -1);

  const [tasks, setTasks] = useState([]);
  const [horses, setHorses] = useState([]);
  const [stables, setStables] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [nowMin, setNowMin] = useState(currentMinutes);
  const [view, setView] = useState("all");

  useEffect(() => {
    let ignore = false;
    Promise.all([getCareTasks(groomId), getHorses(), getStableNumbers()])
      .then(([taskList, horseList, stableMap]) => {
        if (ignore) return;
        setTasks(taskList);
        setHorses(horseList);
        setStables(stableMap);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err.message || "Không tải được công việc.");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [groomId]);

  // Cập nhật giờ hiện tại mỗi phút để dấu "Trễ" tự đổi
  useEffect(() => {
    const timer = setInterval(() => setNowMin(currentMinutes()), 60000);
    return () => clearInterval(timer);
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const horseName = (horseId) => horseById[horseId]?.Ten ?? `Ngựa #${horseId}`;

  // Việc hiển thị: việc hôm nay + việc chưa xong của ngày trước (tồn)
  const visibleTasks = tasks.filter((t) => t.Ngay === today || (!t.TrangThai && t.Ngay < today));
  const isBacklog = (t) => !t.TrangThai && t.Ngay < today;
  const pendingCount = visibleTasks.filter((t) => !t.TrangThai).length;

  // Trễ: chưa xong, là việc hôm nay, giờ hiện tại nằm trong khung làm việc và giờ chuẩn đã qua
  const inWorkWindow = nowMin >= toMinutes(CARE_WORK_WINDOW.tu) && nowMin <= toMinutes(CARE_WORK_WINDOW.den);
  const taskTime = (t) => t.Gio || getTaskTime(t.LoaiViec);
  const isLate = (t) => {
    const gio = taskTime(t);
    return !t.TrangThai && t.Ngay === today && inWorkWindow && Boolean(gio) && toMinutes(gio) < nowMin;
  };

  // Cùng ngày → theo giờ → theo số chuồng (A1 → A2 → …) → tên ngựa
  const byTime = (a, b) =>
    a.Ngay.localeCompare(b.Ngay) ||
    taskTime(a).localeCompare(taskTime(b)) ||
    (stables[a.HorseID] ?? "").localeCompare(stables[b.HorseID] ?? "") ||
    horseName(a.HorseID).localeCompare(horseName(b.HorseID), "vi");

  const backlog = visibleTasks.filter(isBacklog).sort(byTime);
  const todayTasks = visibleTasks.filter((t) => t.Ngay === today);
  const doneToday = todayTasks.filter((t) => t.TrangThai);
  const openToday = todayTasks.filter((t) => !t.TrangThai);
  const listToday = view === "done" ? doneToday : view === "open" ? openToday : todayTasks;
  const backlogList = view === "done" ? [] : backlog;
  // Việc tiếp theo: chưa xong có giờ sớm nhất, việc tồn luôn trước (backlog đã sắp theo ngày cũ nhất trước)
  const nextTask = backlog[0] ?? [...openToday].sort(byTime)[0] ?? null;

  const shiftOf = (t) => {
    const named = CARE_TASK_SCHEDULE[t.LoaiViec]?.ca;
    if (named) return named;
    const gio = taskTime(t);
    if (!gio) return "";
    return toMinutes(gio) < 12 * 60 ? "Sáng" : "Chiều";
  };

  const shiftGroups = Object.entries(CARE_SHIFTS)
    .map(([key, shift]) => ({
      key,
      title: `${shift.label} · ${shift.tu}–${shift.den}`,
      rows: listToday.filter((t) => shiftOf(t) === key).sort(byTime),
    }))
    .filter((g) => g.rows.length > 0);
  const otherToday = listToday.filter((t) => !shiftOf(t)).sort(byTime);
  if (otherToday.length > 0) shiftGroups.push({ key: "other", title: "Việc khác", rows: otherToday });

  const backlogOnlyYesterday = backlogList.every((t) => t.Ngay === yesterday);
  const listEmpty = backlogList.length === 0 && shiftGroups.length === 0;
  const emptyText =
    view === "done"
      ? "Chưa có việc nào được xác nhận xong."
      : view === "open"
        ? "Bạn đã xong phần việc đang chờ."
        : "Hôm nay bạn không có công việc nào.";
  const viewCount = { all: visibleTasks.length, done: doneToday.length, open: pendingCount };
  const otherRows = shiftGroups.find((group) => group.key === "other")?.rows ?? [];

  const handleConfirm = async (task) => {
    setSavingId(task.TaskID);
    try {
      const done = await completeCareTask(task.TaskID, groomId);
      const name = horseName(done.HorseID);
      addAuditLog({
        UserID: groomId,
        HanhDong: `Xác nhận xong ${done.LoaiViec.toLocaleLowerCase("vi")}`,
        TargetTable: "CARETASK",
        TargetID: done.TaskID,
        targetLabel: name,
      });
      setTasks((prev) => prev.map((t) => (t.TaskID === done.TaskID ? done : t)));
      setToast({ text: `Đã xác nhận: ${done.LoaiViec} – ${name}` });
    } catch (err) {
      setToast({ text: err.message, error: true });
    } finally {
      setSavingId(null);
    }
  };

  // prev: việc đứng ngay trên trong cùng nhóm. Việc tồn: giờ ghi "dd/MM · HH:mm" chữ cam đậm. Trong ca: việc cùng giờ chuẩn
  // với hàng trên để trống ô giờ (giữ căn cột); hàng đầu của giờ mới cách hàng trên thêm 8px.
  const renderRow = (task, prev = null, inBacklog = false) => {
    const gio = taskTime(task);
    const sameTimeAsPrev = !inBacklog && prev !== null && taskTime(prev) === gio;
    const backlogTime = `${formatDayMonth(task.Ngay)} · ${gio}`;
    return (
      <CareTaskRow
        key={task.TaskID}
        task={task}
        timeLabel={inBacklog ? backlogTime : sameTimeAsPrev ? "" : gio}
        mobileTime={inBacklog ? backlogTime : gio}
        highlight={inBacklog}
        late={isLate(task)}
        gapBefore={!inBacklog && prev !== null && !sameTimeAsPrev}
        horse={horseById[task.HorseID]}
        horseName={horseName(task.HorseID)}
        stable={stables[task.HorseID]}
        saving={savingId === task.TaskID}
        onConfirm={handleConfirm}
      />
    );
  };

  return (
    <div className="max-w-[900px]">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Công việc hôm nay</h1>
      <p className="mt-1 text-sm text-stone">
        Hôm nay, {formatDate(today)}
        {!loading && pendingCount > 0 && ` · còn ${pendingCount} việc chưa xong`}
      </p>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : visibleTasks.length === 0 ? (
        <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">Hôm nay bạn không có công việc nào.</p>
      ) : (
        <div className="mt-5 space-y-8">
          <NextTaskBanner
            task={nextTask}
            gio={nextTask ? taskTime(nextTask) : ""}
            horse={nextTask && horseById[nextTask.HorseID]}
            horseName={nextTask ? horseName(nextTask.HorseID) : ""}
            stable={nextTask && stables[nextTask.HorseID]}
            late={nextTask ? isLate(nextTask) : false}
            isBacklog={nextTask ? isBacklog(nextTask) : false}
            saving={nextTask ? savingId === nextTask.TaskID : false}
            onConfirm={handleConfirm}
          />

          {backlogList.length > 0 && (
            <section aria-label="Việc tồn">
              <h2 className={GROUP_TITLE}>
                {backlogOnlyYesterday ? "Tồn từ hôm qua" : "Tồn từ các ngày trước"} · {backlogList.length}
              </h2>
              <ul>{backlogList.map((t, i) => renderRow(t, backlogList[i - 1] ?? null, true))}</ul>
            </section>
          )}

          {shiftGroups
            .filter((group) => group.key !== "other")
            .map((group) => (
              <section key={group.key} aria-label={group.title}>
                <h2 className={GROUP_TITLE}>{group.title}</h2>
                <ul>{group.rows.map((t, i) => renderRow(t, group.rows[i - 1] ?? null))}</ul>
              </section>
            ))}

          <section aria-label="Việc khác">
            <h2 className={GROUP_TITLE}>Việc khác</h2>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Lọc công việc">
              {VIEWS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={view === item.id}
                  onClick={() => setView(item.id)}
                  className={chipClass(view === item.id)}
                >
                  {item.label} · {viewCount[item.id]}
                </button>
              ))}
            </div>
            {otherRows.length > 0 && <ul>{otherRows.map((t, i) => renderRow(t, otherRows[i - 1] ?? null))}</ul>}
            {listEmpty && <p className="border-b border-stone/15 py-10 text-center text-sm text-stone">{emptyText}</p>}
          </section>
        </div>
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
