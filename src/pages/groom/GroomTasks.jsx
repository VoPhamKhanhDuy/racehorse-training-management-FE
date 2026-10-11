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
  const visibleTasks = tasks.filter((t) => t.Ngay === today || (!t.TrangThai && t.Ngay < today));
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
  // Việc tiếp theo: chưa xong có giờ sớm nhất, việc tồn luôn trước (backlog đã sắp theo ngày cũ nhất trước)
  const nextTask = backlog[0] ?? [...todayTasks].filter((t) => !t.TrangThai).sort(byTime)[0] ?? null;

  // Việc đang hiện ở khối "Việc tiếp theo" thì không lặp lại trong danh sách bên dưới (kể cả nhóm tồn)
  const listed = (t) => t.TaskID !== nextTask?.TaskID;
  const backlogList = backlog.filter(listed);

  const shiftGroups = Object.entries(CARE_SHIFTS)
    .map(([key, shift]) => ({
      key,
      title: `${shift.label} · ${shift.tu}–${shift.den}`,
      rows: todayTasks.filter((t) => listed(t) && CARE_TASK_SCHEDULE[t.LoaiViec]?.ca === key).sort(byTime),
    }))
    .filter((g) => g.rows.length > 0);
  const otherToday = todayTasks.filter((t) => listed(t) && !CARE_TASK_SCHEDULE[t.LoaiViec]).sort(byTime);
  if (otherToday.length > 0) shiftGroups.push({ key: "other", title: "Việc khác", rows: otherToday });

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

  return (
    <div className="max-w-[900px]">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Công việc hôm nay</h1>
      <p className="mt-1 text-sm text-stone">
        Hôm nay, {formatDate(today)}
        {!loading && pendingCount > 0 && ` · còn ${pendingCount} việc chưa xong`}
      </p>

      {loading ? (
        <LoadingState />
      ) : visibleTasks.length === 0 ? (
        <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">Hôm nay bạn không có công việc nào.</p>
      ) : (
        <div className="mt-5 space-y-8">
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
            <section aria-label="Việc tồn">
              <h2 className={GROUP_TITLE}>
                {backlogOnlyYesterday ? "Tồn từ hôm qua" : "Tồn từ các ngày trước"} · {backlogList.length}
              </h2>
              <ul>{backlogList.map((t, i) => renderRow(t, backlogList[i - 1] ?? null, true))}</ul>
            </section>
          )}

          {shiftGroups.map((group) => (
            <section key={group.key} aria-label={group.title}>
              <h2 className={GROUP_TITLE}>{group.title}</h2>
              <ul>{group.rows.map((t, i) => renderRow(t, group.rows[i - 1] ?? null))}</ul>
            </section>
          ))}
        </div>
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
