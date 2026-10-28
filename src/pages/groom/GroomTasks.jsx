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

// Số phút từ 0h của thời điểm hiện tại
const currentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// "Phiếu việc trong ngày" của nhân viên chăm sóc (CARETASK, chỉ việc có GroomID = người đang đăng nhập):
// khối "Việc tiếp theo" + phiếu theo giờ (nhóm tồn trên cùng, rồi Ca sáng / Ca chiều). Giờ lấy theo loại việc
// (config/careTaskSchedule.js — ERD chưa có trường giờ). Việc đã xong làm mờ nhưng giữ đúng vị trí giờ.
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
  const [nowMin, setNowMin] = useState(currentMinutes);
  const [doneBacklogIds, setDoneBacklogIds] = useState([]); // việc tồn vừa hoàn thành: vẫn hiện ở mục "Đã hoàn thành" trong phiên này

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock careService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getCareTasks(groomId), getHorses(), getStableNumbers()]).then(([taskList, horseList, stableMap]) => {
      if (ignore) return;
      setTasks(taskList);
      setHorses(horseList);
      setStables(stableMap);
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
  const isLate = (t) => {
    const gio = getTaskTime(t.LoaiViec);
    return !t.TrangThai && t.Ngay === today && inWorkWindow && Boolean(gio) && toMinutes(gio) < nowMin;
  };

  // Cùng ngày → theo giờ → theo số chuồng (A1 → A2 → …) → tên ngựa
  const byTime = (a, b) =>
    a.Ngay.localeCompare(b.Ngay) ||
    getTaskTime(a.LoaiViec).localeCompare(getTaskTime(b.LoaiViec)) ||
    (stables[a.HorseID] ?? "").localeCompare(stables[b.HorseID] ?? "") ||
    horseName(a.HorseID).localeCompare(horseName(b.HorseID), "vi");

  const backlog = visibleTasks.filter(isBacklog).sort(byTime);
  const todayTasks = visibleTasks.filter((t) => t.Ngay === today);
  // Việc đã hoàn thành chuyển xuống mục "Đã hoàn thành" ở cuối trang (cũ → mới theo ngày, giờ)
  const doneTasks = visibleTasks.filter((t) => t.TrangThai).sort(byTime);
  // Việc tiếp theo: chưa xong có giờ sớm nhất, việc tồn luôn trước (backlog đã sắp theo ngày cũ nhất trước)
  const nextTask = backlog[0] ?? [...todayTasks].filter((t) => !t.TrangThai).sort(byTime)[0] ?? null;

  // Việc đang hiện ở khối "Việc tiếp theo" thì không lặp lại trong danh sách bên dưới (kể cả nhóm tồn)
  const listed = (t) => t.TaskID !== nextTask?.TaskID;
  const backlogList = backlog.filter(listed);

  const shiftGroups = Object.entries(CARE_SHIFTS)
    .map(([key, shift]) => ({
      key,
      title: `${shift.label} · ${shift.tu}–${shift.den}`,
      label: shift.label,
      range: `${shift.tu}–${shift.den}`,
      rows: todayTasks.filter((t) => listed(t) && !t.TrangThai && CARE_TASK_SCHEDULE[t.LoaiViec]?.ca === key).sort(byTime),
    }))
    .filter((g) => g.rows.length > 0);
  const otherToday = todayTasks.filter((t) => listed(t) && !t.TrangThai && !CARE_TASK_SCHEDULE[t.LoaiViec]).sort(byTime);
  if (otherToday.length > 0) shiftGroups.push({ key: "other", title: "Việc khác", label: "Việc khác", range: "", rows: otherToday });

  const backlogOnlyYesterday = backlogList.every((t) => t.Ngay === yesterday);

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
    const gio = getTaskTime(task.LoaiViec);
    const sameTimeAsPrev = !inBacklog && prev !== null && getTaskTime(prev.LoaiViec) === gio;
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
    const inShift = todayTasks.filter((t) =>
      key === "other" ? !CARE_TASK_SCHEDULE[t.LoaiViec] : CARE_TASK_SCHEDULE[t.LoaiViec]?.ca === key
    );
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

          <NextTaskBanner
            task={nextTask}
            gio={nextTask ? getTaskTime(nextTask.LoaiViec) : ""}
            horse={nextTask && horseById[nextTask.HorseID]}
            horseName={nextTask ? horseName(nextTask.HorseID) : ""}
            stable={nextTask && stables[nextTask.HorseID]}
            late={nextTask ? isLate(nextTask) : false}
            isBacklog={nextTask ? isBacklog(nextTask) : false}
            saving={nextTask ? savingId === nextTask.TaskID : false}
            onConfirm={handleConfirm}
          />

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
