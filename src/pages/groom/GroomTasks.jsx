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

const GROUP_FRAME = "overflow-hidden rounded-[4px] border border-[#b9ab90] bg-white";
const GROUP_HEAD = "flex items-baseline gap-3 border-b border-[#d9cfba] bg-[#f3ede0] px-5 py-3";
const VIEWS = [
  { id: "all", label: "Tất cả" },
  { id: "done", label: "Đã xong" },
  { id: "open", label: "Chưa xong" },
];

const chipClass = (active) =>
  `h-9 cursor-pointer rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c] ${
    active ? "border-[#c2570c] bg-[#fbf3e6] font-semibold text-[#2b2118]" : "border-[#cfc4ad] bg-white text-[#4a3f33] hover:border-[#b9ab90]"
  }`;

// Số phút từ 0h của thời điểm hiện tại
const currentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// "Phiếu việc trong ngày" của nhân viên chăm sóc (CARETASK, chỉ việc có GroomID = người đang đăng nhập):
// khối "Việc tiếp theo" + phiếu theo giờ (nhóm tồn trên cùng, rồi Ca sáng / Ca chiều) + mục "Đã hoàn thành". Bộ lọc
// Tất cả / Đã xong / Chưa xong. Giờ lấy từ việc (Gio); không có thì dùng giờ chuẩn theo loại việc (config/careTaskSchedule.js).
// "Xác nhận xong" không hoàn tác được.
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
  const [doneBacklogIds, setDoneBacklogIds] = useState([]); // việc tồn vừa hoàn thành: vẫn hiện ở mục "Đã hoàn thành" trong phiên này

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
  const visibleTasks = tasks.filter((t) => t.Ngay === today || (!t.TrangThai && t.Ngay < today) || doneBacklogIds.includes(t.TaskID));
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
  // Việc đã hoàn thành chuyển xuống mục "Đã hoàn thành" ở cuối trang (cũ → mới theo ngày, giờ); bộ lọc "Chưa xong" thì ẩn mục này
  const doneTasks = view === "open" ? [] : visibleTasks.filter((t) => t.TrangThai).sort(byTime);
  // Việc tiếp theo: chưa xong có giờ sớm nhất, việc tồn luôn trước (backlog đã sắp theo ngày cũ nhất trước)
  const nextTask = backlog[0] ?? [...openToday].sort(byTime)[0] ?? null;

  // Việc đang hiện ở khối "Việc tiếp theo" thì không lặp lại trong danh sách bên dưới (kể cả nhóm tồn)
  const listed = (t) => t.TaskID !== nextTask?.TaskID;
  const backlogList = view === "done" ? [] : backlog.filter(listed);

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
      label: shift.label,
      range: `${shift.tu}–${shift.den}`,
      rows: listToday.filter((t) => listed(t) && !t.TrangThai && shiftOf(t) === key).sort(byTime),
    }))
    .filter((g) => g.rows.length > 0);
  const otherToday = listToday.filter((t) => listed(t) && !t.TrangThai && !shiftOf(t)).sort(byTime);
  if (otherToday.length > 0) shiftGroups.push({ key: "other", title: "Việc khác", label: "Việc khác", range: "", rows: otherToday });

  const backlogOnlyYesterday = backlogList.every((t) => t.Ngay === yesterday);
  const viewCount = { all: visibleTasks.length, done: doneToday.length, open: pendingCount };
  const emptyText =
    view === "done" && doneTasks.length === 0
      ? "Chưa có việc nào được xác nhận xong."
      : view === "open" && !nextTask
        ? "Bạn đã xong phần việc đang chờ."
        : "";

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
      if (done.Ngay < today) setDoneBacklogIds((prev) => [...prev, done.TaskID]);
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

  // Chỉ để hiển thị: số việc của 1 ca (cả việc đang ở khối "Việc tiếp theo") và số đã xong
  const shiftStats = (key) => {
    const inShift = todayTasks.filter((t) => (key === "other" ? !shiftOf(t) : shiftOf(t) === key));
    return { total: inShift.length, done: inShift.filter((t) => t.TrangThai).length };
  };

  const totalCount = visibleTasks.length;
  const doneCount = totalCount - pendingCount;

  return (
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Công việc hôm nay</h1>
      <p className="mt-1 text-sm text-[#4a3f33]">Hôm nay, {formatDate(today)}</p>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : visibleTasks.length === 0 ? (
        <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">Hôm nay bạn không có công việc nào.</p>
      ) : (
        <div className="mt-6 space-y-6">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <p className="text-[15px] font-semibold text-[#2b2118]">Còn {pendingCount} việc chưa xong</p>
              <p className="text-sm text-[#6b6055] tabular-nums">
                {doneCount}/{totalCount} đã hoàn thành
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Tiến độ công việc"
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-valuenow={doneCount}
              className="mt-2 h-1.5 overflow-hidden rounded-[2px] bg-[#ece5d6]"
            >
              <div className="h-full bg-[#4d6b2a]" style={{ width: `${(doneCount / totalCount) * 100}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc công việc">
            {VIEWS.map((item) => (
              <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)} className={chipClass(view === item.id)}>
                {item.label} · {viewCount[item.id]}
              </button>
            ))}
          </div>

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

          {emptyText && <p className="rounded-[4px] border border-[#d9cfba] bg-white py-10 text-center text-sm text-[#4a3f33]">{emptyText}</p>}

          {backlogList.length > 0 && (
            <section aria-label="Việc tồn" className={GROUP_FRAME}>
              <div className={GROUP_HEAD}>
                <h2 className="font-serif text-[17px] font-semibold text-[#2b2118]">
                  {backlogOnlyYesterday ? "Tồn từ hôm qua" : "Tồn từ các ngày trước"}
                </h2>
                <span className="ml-auto text-[13px] font-semibold text-[#c0262d] tabular-nums">{backlogList.length} việc</span>
              </div>
              <ul>{backlogList.map((t, i) => renderRow(t, backlogList[i - 1] ?? null, true))}</ul>
            </section>
          )}

          {shiftGroups.map((group) => {
            const { total, done } = shiftStats(group.key);
            return (
              <section key={group.key} aria-label={group.title} className={GROUP_FRAME}>
                <div className={GROUP_HEAD}>
                  <h2 className="font-serif text-[17px] font-semibold text-[#2b2118]">{group.label}</h2>
                  {group.range && <span className="text-[13px] text-[#6b6055]">{group.range}</span>}
                  <span
                    className={`ml-auto text-[13px] font-semibold tabular-nums ${done === total ? "text-[#4d6b2a]" : "text-[#2b2118]"}`}
                  >
                    {done}/{total} việc
                  </span>
                </div>
                <ul>{group.rows.map((t, i) => renderRow(t, group.rows[i - 1] ?? null))}</ul>
              </section>
            );
          })}

          {doneTasks.length > 0 && (
            <section aria-label="Đã hoàn thành" className={GROUP_FRAME}>
              <div className={GROUP_HEAD}>
                <h2 className="font-serif text-[17px] font-semibold text-[#2b2118]">Đã hoàn thành</h2>
                <span className="ml-auto text-[13px] font-semibold text-[#4d6b2a] tabular-nums">{doneTasks.length} việc</span>
              </div>
              <ul>{doneTasks.map((t, i) => renderRow(t, doneTasks[i - 1] ?? null, t.Ngay < today))}</ul>
            </section>
          )}
        </div>
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
