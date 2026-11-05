import { useState } from "react";
import Modal from "../../components/Modal";
import TextAreaField from "../../components/TextAreaField";
import useAuth from "../../hooks/useAuth";
import { CARE_NOTE_MAX, completeCareTask } from "../../services/careLogMock";
import { toMinutes } from "../../config/careTaskSchedule";

const TH = "border-r border-[#E3E3E3] px-[14px] text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const TD = "border-r border-b border-[#E3E3E3] px-[14px] py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";
const FILTER = "h-9 cursor-pointer rounded-[4px] border border-[#E3E3E3] bg-white px-2.5 text-sm text-[#1f1f1f] outline-none focus:border-[#c2570c]";
const hhmm = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// Bảng "Chăm sóc hằng ngày" (bảng trung tính). Cột: Giờ | Ngựa (chuồng) | Công việc (dòng phụ: khẩu phần) | Trạng thái.
// Trạng thái = ô DẤU TÍCH: bấm tích → hộp nhỏ ghi chú tùy chọn (≤ 200 ký tự) → "Xác nhận" mới hoàn thành (không hoàn tác được);
// đã xong hiện ô đã tích + "Đã xong lúc HH:mm" (+ ghi chú). Việc quá giờ mà chưa làm: "Quá giờ" chữ cam. Chưa tích: "Chưa xác nhận"; tích xong: "Đã hoàn thành" chữ xanh lá.
// tasks: việc tự sinh (utils/careDailyTasks.js); logs: map key → { completedAt, note } (services/careLogMock.js); nowMin: số phút từ 0h.
export default function GroomCareTable({ tasks, logs, nowMin }) {
  const { user } = useAuth();
  const [horseFilter, setHorseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [target, setTarget] = useState(null); // việc đang chờ xác nhận hoàn thành
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stateOf = (task) => (logs[task.key] ? "done" : toMinutes(task.time) < nowMin ? "overdue" : "todo");
  const doneCount = tasks.filter((t) => logs[t.key]).length;

  const horses = [...new Map(tasks.map((t) => [t.horseId, t.horseName])).entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"));
  const visible = tasks.filter((t) => (!horseFilter || String(t.horseId) === horseFilter) && (!statusFilter || stateOf(t) === statusFilter));

  const openConfirm = (task) => {
    setTarget(task);
    setNote("");
    setError("");
  };
  const closeConfirm = () => {
    if (!busy) setTarget(null);
  };
  const handleConfirm = async () => {
    setBusy(true);
    setError("");
    try {
      await completeCareTask(target.key, note, user.fullName);
      setTarget(null);
    } catch (err) {
      setError(err.message || "Không lưu được, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Chăm sóc hằng ngày">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#2b2118]">Chăm sóc hằng ngày</h2>
          <p className="mt-1 text-sm text-[#4a3f33]">
            Đã xong {doneCount}/{tasks.length} việc chăm sóc
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="careHorse">
            Lọc theo ngựa
          </label>
          <select id="careHorse" value={horseFilter} onChange={(e) => setHorseFilter(e.target.value)} className={FILTER}>
            <option value="">Tất cả ngựa</option>
            {horses.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="careStatus">
            Lọc theo trạng thái
          </label>
          <select id="careStatus" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={FILTER}>
            <option value="">Tất cả trạng thái</option>
            <option value="todo">Chưa xác nhận</option>
            <option value="overdue">Quá giờ</option>
            <option value="done">Đã hoàn thành</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[4px] border border-[#E3E3E3] bg-white py-10 text-center text-sm text-[#6b6b6b]">Không có việc nào khớp bộ lọc.</div>
      ) : (
        <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "38%" }} />
            </colgroup>
            <thead>
              <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
                <th className={TH}>Giờ</th>
                <th className={TH}>Ngựa</th>
                <th className={TH}>Công việc</th>
                <th className={TH}>Trạng thái</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {visible.map((task) => {
                const state = stateOf(task);
                const log = logs[task.key];
                return (
                  <tr key={task.key} className="h-14 bg-white transition-colors hover:bg-[#FAFAFA]">
                    <td className={`${TD} whitespace-nowrap tabular-nums`}>{task.time}</td>
                    <td className={TD}>
                      <span className="block truncate font-semibold" title={task.horseName}>
                        {task.horseName}
                      </span>
                      {task.stable && <span className="block truncate text-xs text-[#6b6b6b]">Chuồng {task.stable}</span>}
                    </td>
                    <td className={TD}>
                      <span className="block truncate">{task.label}</span>
                      {task.detail && <span className="block truncate text-xs text-[#6b6b6b]">{task.detail}</span>}
                    </td>
                    <td className={TD}>
                      <label className={`flex items-start gap-2.5 ${state === "done" ? "cursor-default" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          checked={state === "done"}
                          disabled={state === "done"}
                          onChange={() => state !== "done" && openConfirm(task)}
                          aria-label={`Xác nhận hoàn thành: ${task.label} – ${task.horseName}`}
                          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#c2570c] disabled:cursor-default"
                        />
                        <span className="min-w-0">
                          <span
                            className={`whitespace-nowrap ${
                              state === "done" ? "font-semibold text-[#4d6b2a]" : state === "overdue" ? "font-semibold text-[#c2570c]" : "font-medium"
                            }`}
                          >
                            {state === "done" ? `Đã hoàn thành lúc ${hhmm(log.completedAt)}` : state === "overdue" ? "Quá giờ" : "Chưa xác nhận"}
                          </span>
                          {state === "done" && log.note && (
                            <span className="block truncate text-xs text-[#6b6b6b]" title={log.note}>
                              {log.note}
                            </span>
                          )}
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(target)} title="Hoàn thành công việc" onClose={closeConfirm} size="sm">
        {target && (
          <>
            <p className="text-sm text-[#6b6055]">
              {target.label} – {target.horseName}
              {target.detail ? ` (${target.detail})` : ""}. Xác nhận xong không hoàn tác được.
            </p>
            <div className="mt-4">
              <TextAreaField
                label="Ghi chú"
                id="careNote"
                rows={3}
                value={note}
                maxLength={CARE_NOTE_MAX}
                radiusClass="rounded-[4px]"
                placeholder="Không bắt buộc"
                onChange={(e) => setNote(e.target.value)}
                error={error}
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={busy}
                className="inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:opacity-60"
              >
                Hủy
              </button>
              <button type="button" onClick={handleConfirm} disabled={busy} className="btn-primary">
                {busy ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
