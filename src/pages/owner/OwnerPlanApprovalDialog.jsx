import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import HorseAvatar from "../../components/HorseAvatar";
import IntensityText from "../../components/IntensityText";
import TextAreaField from "../../components/TextAreaField";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { PLAN_APPROVAL_NOTE_MAX } from "../../services/planApprovalMock";
import { daysBetween, formatDate, formatDayMonth } from "../../utils/date";
import { PLAN_APPROVAL } from "../../utils/planStatus";
import { formatKm } from "../../utils/trainingFormat";
import OwnerPlanApprovalStatus from "./OwnerPlanApprovalStatus";

const SESSION_PREVIEW_LIMIT = 8;
const GENERIC_OBJECTIVES = ["huấn luyện", "tập luyện", "luyện tập", "giáo án", "kế hoạch"];
const SECTION_TITLE = "font-serif text-base font-semibold text-[#2b2118]";
const REJECT_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-[#9e5954]/40 bg-white px-5 text-sm font-semibold text-[#9e5954] transition-colors hover:border-[#9e5954] hover:bg-[#9e5954]/10";
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";

// Tên giai đoạn do HLV nhập tay ("nền tảng thể lực") → viết hoa chữ đầu khi hiển thị
const capitalizeFirst = (text = "") => text.charAt(0).toUpperCase() + text.slice(1);

function InfoRow({ label, children }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 text-sm">
      <dt className="text-[#6b6055]">{label}</dt>
      <dd className="text-[#2b2118]">{children}</dd>
    </div>
  );
}

function PhaseStat({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-[#6b6055]">{label}</dt>
      <dd className="text-sm text-[#2b2118] tabular-nums">{children}</dd>
    </div>
  );
}

// Chi tiết kế hoạch huấn luyện của Chủ ngựa: MODAL giữa màn hình (MOCK — services/planApprovalMock.js). Chỉ đọc, ẩn ghi chú nội bộ của Trainer.
// Đầu + chân cố định, chỉ thân cuộn. Chờ duyệt: chân có "Yêu cầu chỉnh sửa" / "Đồng ý"; bấm Yêu cầu chỉnh sửa thì ô lý do
// (bắt buộc, ≤ 300 ký tự) hiện ngay phía trên chân. Đã quyết định: chỉ có nút "Đóng".
// onApprove(planId) / onRequestChanges(planId, note) / onReject(planId, note): async, trang cha lo đóng modal + toast; ném lỗi thì hiện trong modal.
export default function OwnerPlanApprovalDialog({ record, horse, onClose, onApprove, onRequestChanges, onReject }) {
  const { label } = useTrainingOptions({ remote: false });
  const plan = record.snapshot;
  const pending = record.status === PLAN_APPROVAL.PENDING;
  const [mode, setMode] = useState("view"); // "view" | "reason"
  const [kind, setKind] = useState("changes"); // lý do cho: "changes" (yêu cầu chỉnh sửa) | "reject" (từ chối)
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showAllSessions, setShowAllSessions] = useState(false);
  const closeRef = useRef(null);

  // Esc đóng modal (trừ khi hộp xác nhận đang mở — Esc chỉ đóng hộp đó); khóa cuộn trang phía sau; trả focus khi đóng
  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !confirmApprove && !busy) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, confirmApprove, busy]);

  const typeLabel = plan.trainingType ? label("planTypes", plan.trainingType) : "";
  const sessions = showAllSessions ? plan.sessions : plan.sessions.slice(0, SESSION_PREVIEW_LIMIT);
  // Mục tiêu trùng chữ với tên giáo án / loại giáo án thì không hiện
  const objective = (plan.objective ?? "").trim();
  const normalized = (text) => text.trim().toLowerCase();
  // hoặc chỉ là chữ chung chung như "Huấn luyện"
  const objectiveIsGeneric = GENERIC_OBJECTIVES.includes(normalized(objective));
  const objectiveDuplicates = objectiveIsGeneric || [plan.planName, typeLabel].some(
    (text) => text && (normalized(text) === normalized(objective) || normalized(text).includes(normalized(objective)))
  );

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message || "Không thực hiện được, vui lòng thử lại.");
      setConfirmApprove(false);
      setBusy(false);
    }
  };

  const openReason = (nextKind) => {
    setKind(nextKind);
    setNote("");
    setNoteError("");
    setError("");
    setMode("reason");
  };

  const submitReason = () => {
    if (!note.trim()) {
      setNoteError("Vui lòng nhập lý do cần chỉnh sửa");
      return;
    }
    run(() => (kind === "reject" ? onReject(record.planId, note.trim()) : onRequestChanges(record.planId, note.trim())));
  };

  const handleBackdrop = () => {
    if (!busy) onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#232328]/40" onClick={handleBackdrop} aria-hidden="true" />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Kế hoạch huấn luyện ${plan.horseName}`}
          className="relative flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-md bg-white shadow-xl"
        >
          {/* Đầu cố định */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 sm:px-8">
            <HorseAvatar horse={horse} size={44} square />
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-xl leading-tight font-semibold text-[#2b2118]">{plan.horseName}</p>
              <div className="mt-1">
                <OwnerPlanApprovalStatus status={record.status} />
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={handleBackdrop}
              aria-label="Đóng"
              className="-m-1 shrink-0 cursor-pointer rounded-[4px] p-1 text-stone outline-none hover:text-ink focus-visible:outline-2 focus-visible:outline-brass"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Thân cuộn */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-8">
            <section>
              <h3 className={SECTION_TITLE}>{plan.planName}</h3>
              <dl className="mt-3 space-y-2">
                <InfoRow label="Huấn luyện viên">{plan.trainerName}</InfoRow>
                <InfoRow label="Thời gian">
                  {formatDate(plan.startDate)} – {formatDate(plan.endDate)}, {daysBetween(plan.startDate, plan.endDate) + 1} ngày
                </InfoRow>
                {typeLabel && <InfoRow label="Loại giáo án">{typeLabel}</InfoRow>}
                {objective && !objectiveDuplicates && <InfoRow label="Mục tiêu">{objective}</InfoRow>}
                {(record.status === PLAN_APPROVAL.CHANGES || record.status === PLAN_APPROVAL.REJECTED) && record.note && (
                  <InfoRow label="Lý do của bạn">
                    <span className="whitespace-pre-line">{record.note}</span>
                  </InfoRow>
                )}
              </dl>
            </section>

            <section className="mt-6 border-t border-stone/15 pt-6">
              <h3 className={SECTION_TITLE}>Các giai đoạn</h3>
              <ul className="mt-3 space-y-6">
                {plan.phases.map((phase, index) => (
                  <li key={phase.phaseId ?? index}>
                    <p className="text-[15px] font-semibold text-[#2b2118]">{capitalizeFirst(phase.phaseName)}</p>
                    {phase.goal && <p className="text-[13px] text-[#6b6055]">{phase.goal}</p>}
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                      <PhaseStat label="Cường độ">
                        <IntensityText code={phase.intensityLevel}>{label("intensityLevels", phase.intensityLevel)}</IntensityText>
                      </PhaseStat>
                      <PhaseStat label="Quãng đường/buổi">{formatKm(phase.targetDistanceKm)}</PhaseStat>
                      <PhaseStat label="Số buổi/tuần">{phase.sessionsPerWeek}</PhaseStat>
                      <PhaseStat label="Thời gian">
                        {formatDayMonth(phase.startDate)} – {formatDayMonth(phase.endDate)}
                      </PhaseStat>
                      <PhaseStat label="Mặt đường">{phase.surface ? label("surfaces", phase.surface) : "Theo bài tập"}</PhaseStat>
                    </dl>
                  </li>
                ))}
              </ul>
            </section>

            {plan.sessions.length > 0 && (
              <section className="mt-6 border-t border-stone/15 pt-6">
                <h3 className={SECTION_TITLE}>Lịch từng buổi ({plan.sessions.length})</h3>
                <ul className="mt-3 space-y-1 text-sm text-[#4a3f33] tabular-nums">
                  {sessions.map((session, index) => (
                    <li key={session.sessionId ?? index}>
                      {formatDate(session.trainingDate)} {session.startTime}
                      {session.trainingType && ` · ${label("trainingTypes", session.trainingType)}`}
                      {session.distanceKm != null && ` · ${formatKm(session.distanceKm)}`}
                    </li>
                  ))}
                </ul>
                {plan.sessions.length > SESSION_PREVIEW_LIMIT && !showAllSessions && (
                  <button
                    type="button"
                    onClick={() => setShowAllSessions(true)}
                    className="mt-2 cursor-pointer text-sm font-semibold text-[#c2570c] underline-offset-2 hover:underline"
                  >
                    Xem thêm ({plan.sessions.length - SESSION_PREVIEW_LIMIT} buổi)
                  </button>
                )}
              </section>
            )}
          </div>

          {/* Chân cố định */}
          <div className="border-t border-stone/15 px-6 pt-4 pb-6 sm:px-8">
            {pending && mode === "reason" && (
              <div className="mb-3">
                <TextAreaField
                  label={kind === "reject" ? "Lý do từ chối" : "Lý do cần chỉnh sửa"}
                  id="requestChangesNote"
                  rows={3}
                  value={note}
                  maxLength={PLAN_APPROVAL_NOTE_MAX}
                  placeholder={kind === "reject" ? "VD: Tôi không muốn tập theo hướng này cho ngựa" : "VD: Cường độ giai đoạn 2 hơi cao so với thể trạng của ngựa"}
                  hint={kind === "reject" ? "Giáo án sẽ bị đóng, huấn luyện viên cần soạn lại hoặc xóa." : undefined}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setNoteError("");
                  }}
                  error={noteError}
                  radiusClass="rounded-[4px]"
                  autoFocus
                />
              </div>
            )}
            {error && <p className="mb-3 text-sm text-alert">{error}</p>}
            <div className="flex justify-end gap-3">
              {!pending && (
                <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
                  Đóng
                </button>
              )}
              {pending && mode === "view" && (
                <>
                  <button type="button" onClick={() => openReason("reject")} className={REJECT_BUTTON}>
                    Từ chối
                  </button>
                  <button type="button" onClick={() => openReason("changes")} className={OUTLINE_BUTTON}>
                    Yêu cầu chỉnh sửa
                  </button>
                  <button type="button" onClick={() => setConfirmApprove(true)} className="btn-primary">
                    Đồng ý
                  </button>
                </>
              )}
              {pending && mode === "reason" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("view");
                      setNoteError("");
                    }}
                    disabled={busy}
                    className={OUTLINE_BUTTON}
                  >
                    Quay lại
                  </button>
                  <button type="button" onClick={submitReason} disabled={busy} className="btn-primary">
                    {busy ? "Đang gửi..." : kind === "reject" ? "Gửi từ chối" : "Gửi yêu cầu"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmApprove}
        title="Đồng ý kế hoạch"
        message={`Đồng ý kế hoạch này cho ${plan.horseName}? Huấn luyện viên sẽ được thông báo và có thể giao lịch tập.`}
        confirmLabel="Đồng ý"
        cancelLabel="Quay lại"
        danger={false}
        loading={busy}
        onConfirm={() => run(() => onApprove(record.planId))}
        onCancel={() => setConfirmApprove(false)}
      />
    </>
  );
}
