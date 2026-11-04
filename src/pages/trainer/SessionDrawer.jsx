import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import ConfirmDialog from "../../components/ConfirmDialog";
import Drawer from "../../components/Drawer";
import TrainingBadge from "../../components/TrainingBadge";
import CancelSessionDialog from "./CancelSessionDialog";
import useApiResource from "../../hooks/useApiResource";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import {
  assignTrainingSession,
  cancelTrainingSession,
  deleteTrainingSession,
  getAssignableStaff,
  getTrainingSession,
  startTrainingSession,
} from "../../services/trainingApi";
import { formatDate, todayISO, weekdayName } from "../../utils/date";
import { formatDateTime, formatKm, formatMinutes, formatNumber, formatTimeRange } from "../../utils/trainingFormat";

const SECTION = "border-b border-stone/10 py-4";
const SECTION_TITLE = "mb-2 text-xs font-semibold tracking-wide text-stone uppercase";
const ROW = "flex items-baseline justify-between gap-4 py-1 text-sm";
const LABEL = "shrink-0 text-stone";
const SECONDARY_BUTTON =
  "cursor-pointer rounded-sm border border-stone/25 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-50";

function InfoRow({ label, children }) {
  return (
    <div className={ROW}>
      <span className={LABEL}>{label}</span>
      <span className="min-w-0 text-right text-ink">{children}</span>
    </div>
  );
}

// Ngăn chi tiết 1 buổi tập (GET /api/trainer/training-sessions/{id}) kèm thao tác theo trạng thái:
// Đã lên lịch → Bắt đầu (chỉ ngày hôm nay, BE kiểm tra lại thể trạng), Sửa, Hủy, Xóa; Đang tập → Ghi kết quả, Hủy;
// phân công người phụ trách khi buổi chưa kết thúc. sessionId = null → đóng.
// onChanged(session | null, message): báo trang cha tải lại danh sách (null = buổi vừa bị xóa).
// Trang cha đặt key={sessionId} để mỗi buổi mở ra là một ngăn mới (không sót thông báo / lựa chọn của buổi trước).
export default function SessionDrawer({ sessionId, onClose, onChanged }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { label } = useTrainingOptions();
  const sessionResource = useApiResource(() => getTrainingSession(sessionId), sessionId ? String(sessionId) : null);
  // Người có thể phân công: lỗi thì để danh sách trống (vẫn xem được buổi tập)
  const staffResource = useApiResource(getAssignableStaff, sessionId ? "staff" : null);
  const session = sessionResource.data ?? null;
  const { loading, error: loadError } = sessionResource;
  const staff = staffResource.data ?? (staffResource.error ? [] : null);
  const [assigneeDraft, setAssigneeDraft] = useState(null); // null = theo người đang phụ trách
  const [busy, setBusy] = useState(""); // thao tác đang chạy: "start" | "assign" | "cancel" | "delete"
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const currentAssignee = session?.assignedToUserId ? String(session.assignedToUserId) : "";
  const assignee = assigneeDraft ?? currentAssignee;

  const applyUpdate = (updated, message) => {
    sessionResource.setData(updated);
    setAssigneeDraft(null);
    setNotice(message);
    onChanged?.(updated, message);
  };

  const runAction = async (name, action) => {
    setBusy(name);
    setActionError(null);
    setNotice("");
    try {
      await action();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy("");
    }
  };

  const handleStart = () =>
    runAction("start", async () => {
      const updated = await startTrainingSession(session.sessionId);
      applyUpdate(updated, `Đã bắt đầu buổi tập lúc ${updated.startTime}.`);
    });

  const handleAssign = () =>
    runAction("assign", async () => {
      const updated = await assignTrainingSession(session.sessionId, assignee ? Number(assignee) : null);
      applyUpdate(updated, updated.assignedToName ? `Đã phân công cho ${updated.assignedToName}.` : "Đã bỏ phân công.");
    });

  // Hộp thoại đóng cả khi lỗi để thấy thông báo lỗi trong ngăn chi tiết
  const handleCancel = (reason) =>
    runAction("cancel", async () => {
      try {
        const updated = await cancelTrainingSession(session.sessionId, reason);
        applyUpdate(updated, "Đã hủy buổi tập.");
      } finally {
        setCancelOpen(false);
      }
    });

  const handleDelete = () =>
    runAction("delete", async () => {
      try {
        await deleteTrainingSession(session.sessionId);
      } finally {
        setDeleteOpen(false);
      }
      onChanged?.(null, `Đã xóa buổi "${session.sessionTitle}".`);
      onClose();
    });

  // Sửa / ghi kết quả ở trang riêng; lưu xong quay lại đúng trang đang đứng
  const goTo = (path) => navigate(path, { state: { from: `${location.pathname}${location.search}` } });

  const status = session?.status;
  const isToday = session?.trainingDate === todayISO();
  const canAssign = status === "Scheduled" || status === "InProgress";
  const assigneeChanged = Boolean(session) && assignee !== currentAssignee;
  // Người đang được phân công nhưng không còn trong danh sách (vd tài khoản đã bị khóa) vẫn hiện để không mất thông tin
  const staffOptions =
    staff && session?.assignedToUserId && !staff.some((s) => s.userId === session.assignedToUserId)
      ? [...staff, { userId: session.assignedToUserId, fullName: session.assignedToName ?? `#${session.assignedToUserId}` }]
      : staff ?? [];

  const header = session ? (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-serif text-lg font-semibold text-ink">{session.sessionTitle}</h2>
        <TrainingBadge kind="sessionStatus" code={status}>
          {label("sessionStatuses", status)}
        </TrainingBadge>
      </div>
      <p className="mt-0.5 text-sm text-stone">
        {session.horseName} · {weekdayName(session.trainingDate)}, {formatDate(session.trainingDate)} ·{" "}
        {formatTimeRange(session.startTime, session.endTime)}
      </p>
    </div>
  ) : (
    <h2 className="font-serif text-lg font-semibold text-ink">Buổi tập</h2>
  );

  const footer =
    session && (status === "Scheduled" || status === "InProgress") ? (
      <>
        {status === "Scheduled" && (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={Boolean(busy)}
            className="mr-auto cursor-pointer text-sm font-medium text-stone underline-offset-2 hover:text-alert hover:underline disabled:opacity-50"
          >
            Xóa
          </button>
        )}
        <button type="button" onClick={() => setCancelOpen(true)} disabled={Boolean(busy)} className={SECONDARY_BUTTON}>
          Hủy buổi
        </button>
        {status === "Scheduled" ? (
          <>
            <button type="button" onClick={() => goTo(`/trainer/sessions/${session.sessionId}/edit`)} className={SECONDARY_BUTTON}>
              Sửa
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={!isToday || Boolean(busy)}
              title={isToday ? undefined : "Chỉ bắt đầu được buổi tập của ngày hôm nay"}
              className="btn-primary"
            >
              {busy === "start" ? "Đang bắt đầu..." : "Bắt đầu"}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => goTo(`/trainer/sessions/${session.sessionId}/result`)} className="btn-primary">
            Ghi kết quả
          </button>
        )}
      </>
    ) : null;

  return (
    <>
      <Drawer open={Boolean(sessionId)} label="Chi tiết buổi tập" header={header} footer={footer} onClose={onClose}>
        {loading && <p className="py-10 text-center text-sm text-stone">Đang tải buổi tập...</p>}
        {loadError && (
          <div className="py-5">
            <ApiErrorNotice error={loadError} />
          </div>
        )}
        {session && (
          <div className="pb-4">
            {(actionError || notice) && (
              <div className="pt-4">
                {actionError ? (
                  <ApiErrorNotice error={actionError} />
                ) : (
                  <p className="rounded-sm border-l-2 border-green-700 bg-green-50/60 px-4 py-2.5 text-sm text-green-800">{notice}</p>
                )}
              </div>
            )}
            {status === "Scheduled" && !isToday && (
              <p className="pt-4 text-xs text-stone">
                Chỉ bắt đầu được vào ngày tập ({formatDate(session.trainingDate)}). Khi bắt đầu, hệ thống kiểm tra lại thể trạng ngựa.
              </p>
            )}

            <section className={SECTION}>
              <h3 className={SECTION_TITLE}>Kế hoạch</h3>
              <InfoRow label="Giáo án">
                <Link to={`/trainer/plans/${session.planId}`} className="font-medium text-brass-deep hover:underline">
                  {session.planName ?? `#${session.planId}`}
                </Link>
              </InfoRow>
              <InfoRow label="Giai đoạn">{session.phaseName ?? "—"}</InfoRow>
              <InfoRow label="Bài tập">
                <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                  {label("trainingTypes", session.trainingType)}
                  <TrainingBadge kind="intensity" code={session.intensityLevel}>
                    {label("intensityLevels", session.intensityLevel)}
                  </TrainingBadge>
                </span>
              </InfoRow>
              <InfoRow label="Mặt sân">{label("surfaces", session.surface) || "—"}</InfoRow>
              <InfoRow label="Cự ly · thời lượng">
                {formatKm(session.distanceKm)} · {formatMinutes(session.durationMinutes)}
              </InfoRow>
              {session.notes && (
                <p className="mt-2 rounded-sm bg-stone/5 px-3 py-2 text-sm text-ink">
                  <span className="font-medium">Dặn dò:</span> {session.notes}
                </p>
              )}
            </section>

            <section className={SECTION}>
              <h3 className={SECTION_TITLE}>Người phụ trách</h3>
              {canAssign ? (
                <div className="flex gap-2">
                  <label htmlFor="sessionAssignee" className="sr-only">
                    Người phụ trách
                  </label>
                  <select
                    id="sessionAssignee"
                    value={assignee}
                    onChange={(e) => setAssigneeDraft(e.target.value)}
                    disabled={!staff || Boolean(busy)}
                    className="min-w-0 flex-1 cursor-pointer rounded-md border border-stone/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brass"
                  >
                    <option value="">Chưa phân công</option>
                    {staffOptions.map((person) => (
                      <option key={person.userId} value={person.userId}>
                        {person.fullName}
                        {person.roleId === "head_trainer" ? " (HLV)" : ""}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleAssign} disabled={!assigneeChanged || Boolean(busy)} className={SECONDARY_BUTTON}>
                    {busy === "assign" ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-ink">{session.assignedToName ?? "Chưa phân công"}</p>
              )}
            </section>

            {status === "Completed" && (
              <section className={SECTION}>
                <h3 className={SECTION_TITLE}>Kết quả</h3>
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-semibold text-ink tabular-nums">{formatNumber(session.performanceScore)}</span>
                  <span className="text-sm text-stone">/ 10 điểm phong độ</span>
                </div>
                <InfoRow label="Cự ly thực tế">{formatKm(session.actualDistanceKm)}</InfoRow>
                <InfoRow label="Thời lượng thực tế">{formatMinutes(session.actualDurationMinutes)}</InfoRow>
                <InfoRow label="Nhịp tim TB / tối đa">
                  {formatNumber(session.avgHeartRate)} / {formatNumber(session.maxHeartRate)} bpm
                </InfoRow>
                <InfoRow label="Vận tốc TB">{session.avgSpeedKmh != null ? `${formatNumber(session.avgSpeedKmh)} km/h` : "—"}</InfoRow>
                {session.result && <InfoRow label="Kết quả">{session.result}</InfoRow>}
                {session.trainerComment && (
                  <p className="mt-2 rounded-sm bg-stone/5 px-3 py-2 text-sm text-ink">
                    <span className="font-medium">Nhận xét chuyên môn:</span> {session.trainerComment}
                  </p>
                )}
                {session.trialVideoUrl && (
                  <a
                    href={session.trialVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-brass-deep hover:underline"
                  >
                    Xem video chạy thử ↗
                  </a>
                )}
              </section>
            )}

            {status === "Cancelled" && session.result && (
              <section className={SECTION}>
                <h3 className={SECTION_TITLE}>Lý do hủy</h3>
                <p className="text-sm text-ink">{session.result}</p>
              </section>
            )}

            {session.createdAt && <p className="pt-3 text-xs text-stone">Tạo lúc {formatDateTime(session.createdAt)}</p>}
          </div>
        )}
      </Drawer>

      {cancelOpen && (
        <CancelSessionDialog
          open
          sessionTitle={session?.sessionTitle}
          loading={busy === "cancel"}
          onConfirm={handleCancel}
          onCancel={() => setCancelOpen(false)}
        />
      )}
      <ConfirmDialog
        open={deleteOpen}
        title="Xóa buổi tập"
        message={`Xóa hẳn buổi "${session?.sessionTitle}" (dùng khi xếp nhầm)? Thao tác này không thể hoàn tác.`}
        loading={busy === "delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
