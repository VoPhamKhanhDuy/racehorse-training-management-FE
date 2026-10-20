import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import TrainingBadge from "../../components/TrainingBadge";
import HorseFitnessPanel from "./HorseFitnessPanel";
import PlanPhaseTable from "./PlanPhaseTable";
import SessionDrawer from "./SessionDrawer";
import SessionTable from "./SessionTable";
import useApiResource from "../../hooks/useApiResource";
import useHorseFitness from "../../hooks/useHorseFitness";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import {
  activateTrainingPlan,
  cancelTrainingPlan,
  completeTrainingPlan,
  deleteTrainingPlan,
  getTrainingPlan,
} from "../../services/trainingApi";
import { formatDate } from "../../utils/date";
import { formatDateTime, formatKm, formatNumber } from "../../utils/trainingFormat";

const SECONDARY_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-sm border border-stone/25 bg-white px-4 text-sm font-semibold whitespace-nowrap text-ink transition-colors hover:border-stone/50";
const SECTION_TITLE = "font-serif text-lg font-semibold text-ink";
const SESSION_FILTERS = [
  { value: "upcoming", label: "Sắp tới" },
  { value: "all", label: "Tất cả" },
];

function Stat({ label, value, hint }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-stone">{label}</p>
      <p className="mt-0.5 font-serif text-xl font-semibold text-ink tabular-nums">{value}</p>
      {hint && <p className="text-xs text-stone">{hint}</p>}
    </div>
  );
}

// Chi tiết giáo án (GET /api/trainer/training-plans/{id}): thông tin chung, tiến độ, giai đoạn, buổi tập + thao tác theo trạng thái.
// Nháp → Sửa, Xem trước lịch tuần, Áp dụng, Hủy, Xóa. Đang áp dụng → Xếp lịch tuần, Thêm buổi tập, Sửa thông tin, Kết thúc, Hủy.
export default function TrainingPlanDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { label } = useTrainingOptions();
  const [message, setMessage] = useState(state?.message ?? "");
  const [actionError, setActionError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // "activate" | "complete" | "cancel" | "delete"
  const [busy, setBusy] = useState(false);
  const [sessionFilter, setSessionFilter] = useState("upcoming");
  const [openSessionId, setOpenSessionId] = useState(null);
  const planResource = useApiResource(() => getTrainingPlan(id), id);
  const { data: plan, loading, error: loadError } = planResource;
  const fitnessState = useHorseFitness(plan?.horseId);

  if (loading) return <LoadingState />;
  if (loadError) return <ApiErrorNotice variant="page" error={loadError} onRetry={planResource.reload} />;

  const { status, progress = {} } = plan;
  const upcomingCount = plan.sessions.filter((s) => s.status === "Scheduled").length;
  const visibleSessions =
    sessionFilter === "upcoming" ? plan.sessions.filter((s) => s.status === "Scheduled" || s.status === "InProgress") : plan.sessions;

  const confirmConfig = {
    activate: {
      title: "Áp dụng giáo án",
      message: `Áp dụng giáo án "${plan.planName}" cho ${plan.horseName}? Mỗi ngựa chỉ có 1 giáo án đang áp dụng; sau khi áp dụng chỉ sửa được thông tin chung, không sửa giai đoạn.`,
      confirmLabel: "Áp dụng",
      danger: false,
      run: () => activateTrainingPlan(plan.planId),
      done: "Đã áp dụng giáo án. Bấm \"Xếp lịch tuần\" để sinh các buổi tập.",
    },
    complete: {
      title: "Kết thúc giáo án",
      message: `Kết thúc giáo án "${plan.planName}"? ${upcomingCount} buổi chưa diễn ra sẽ tự chuyển sang Đã hủy. Không kết thúc được khi còn buổi đang tập.`,
      confirmLabel: "Kết thúc",
      danger: false,
      run: () => completeTrainingPlan(plan.planId),
      done: "Đã kết thúc giáo án.",
    },
    cancel: {
      title: "Hủy giáo án",
      message: `Hủy giáo án "${plan.planName}"? ${upcomingCount} buổi đã lên lịch sẽ tự hủy. Không hủy được khi còn buổi đang tập.`,
      confirmLabel: "Hủy giáo án",
      danger: true,
      run: () => cancelTrainingPlan(plan.planId),
      done: "Đã hủy giáo án.",
    },
    delete: {
      title: "Xóa giáo án nháp",
      message: `Xóa hẳn giáo án nháp "${plan.planName}" và các giai đoạn của nó? Thao tác này không thể hoàn tác.`,
      confirmLabel: "Xóa",
      danger: true,
      run: () => deleteTrainingPlan(plan.planId),
      done: `Đã xóa giáo án nháp "${plan.planName}".`,
    },
  };
  const currentConfirm = confirmAction ? confirmConfig[confirmAction] : null;

  const handleConfirm = async () => {
    const action = confirmAction;
    setBusy(true);
    setActionError(null);
    setMessage("");
    try {
      const updated = await confirmConfig[action].run();
      if (action === "delete") {
        navigate("/trainer/plans", { state: { message: confirmConfig.delete.done } });
        return;
      }
      planResource.setData(updated);
      setMessage(confirmConfig[action].done);
      fitnessState.reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/trainer/plans" className="text-sm font-medium text-brass-deep hover:underline">
        ← Giáo án tập luyện
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">{plan.planName}</h1>
            <TrainingBadge kind="planStatus" code={status}>
              {label("planStatuses", status)}
            </TrainingBadge>
          </div>
          <p className="mt-1 text-sm text-stone">
            <span className="font-medium text-ink">{plan.horseName}</span>
            {plan.trainingType && ` · ${label("planTypes", plan.trainingType)}`} · {formatDate(plan.startDate)} – {formatDate(plan.endDate)} ·{" "}
            {plan.phaseCount} giai đoạn
          </p>
        </div>

        {(status === "Draft" || status === "Active") && (
          <div className="flex flex-wrap items-center gap-2">
            {status === "Draft" && (
              <button
                type="button"
                onClick={() => setConfirmAction("delete")}
                className="mr-2 cursor-pointer text-sm font-medium text-stone underline-offset-2 hover:text-alert hover:underline"
              >
                Xóa nháp
              </button>
            )}
            <button type="button" onClick={() => setConfirmAction("cancel")} className={SECONDARY_BUTTON}>
              Hủy giáo án
            </button>
            {status === "Active" && (
              <button type="button" onClick={() => setConfirmAction("complete")} className={SECONDARY_BUTTON}>
                Kết thúc
              </button>
            )}
            <Link to={`/trainer/plans/${plan.planId}/edit`} className={SECONDARY_BUTTON}>
              {status === "Draft" ? "Sửa" : "Sửa thông tin"}
            </Link>
            {status === "Draft" ? (
              <>
                <Link to={`/trainer/plans/${plan.planId}/weekly-schedule`} className={SECONDARY_BUTTON}>
                  Xem trước lịch tuần
                </Link>
                <button type="button" onClick={() => setConfirmAction("activate")} className="btn-primary">
                  Áp dụng
                </button>
              </>
            ) : (
              <>
                <Link to={`/trainer/plans/${plan.planId}/sessions/new`} className={SECONDARY_BUTTON}>
                  + Thêm buổi tập
                </Link>
                <Link to={`/trainer/plans/${plan.planId}/weekly-schedule`} className="btn-primary">
                  Xếp lịch tuần
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {message && (
          <div className="flex items-center justify-between gap-4 rounded-sm border-l-2 border-green-700 bg-white/60 px-4 py-3 text-sm text-green-800">
            {message}
            <button type="button" onClick={() => setMessage("")} className="cursor-pointer font-semibold text-green-700 hover:underline">
              Đóng
            </button>
          </div>
        )}
        <ApiErrorNotice error={actionError} />
      </div>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div className="min-w-0 space-y-8">
          {(plan.objective || plan.notes) && (
            <section className="grid gap-4 rounded-lg border border-stone/15 bg-white px-5 py-4 sm:grid-cols-2">
              {plan.objective && (
                <div>
                  <p className="text-xs font-medium text-stone">Mục tiêu</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-ink">{plan.objective}</p>
                </div>
              )}
              {plan.notes && (
                <div>
                  <p className="text-xs font-medium text-stone">Ghi chú</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-ink">{plan.notes}</p>
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className={`${SECTION_TITLE} mb-3`}>Tiến độ</h2>
            <div className="rounded-lg border border-stone/15 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
                  <div className="h-full rounded-full bg-moss" style={{ width: `${Math.min(100, Number(progress.completionRate) || 0)}%` }} />
                </div>
                <span className="text-sm font-semibold text-ink tabular-nums">{formatNumber(progress.completionRate ?? 0)}%</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Tổng buổi" value={progress.totalSessions ?? 0} />
                <Stat label="Hoàn thành" value={progress.completedSessions ?? 0} />
                <Stat label="Sắp tới" value={progress.upcomingSessions ?? 0} />
                <Stat label="Đã hủy" value={progress.cancelledSessions ?? 0} />
                <Stat label="Điểm TB" value={progress.averagePerformanceScore != null ? formatNumber(progress.averagePerformanceScore) : "—"} />
                <Stat label="Cự ly thực tế" value={formatKm(progress.totalActualDistanceKm ?? 0)} />
              </div>
            </div>
          </section>

          <section>
            <h2 className={`${SECTION_TITLE} mb-3`}>Giai đoạn</h2>
            <PlanPhaseTable phases={plan.phases} markCurrent={status === "Active"} />
          </section>
        </div>

        <aside className="rounded-lg border border-stone/15 bg-white px-5 py-5 lg:sticky lg:top-24">
          <HorseFitnessPanel
            fitness={fitnessState.fitness}
            loading={fitnessState.loading}
            error={fitnessState.error}
            onRefresh={fitnessState.reload}
          />
        </aside>
      </div>

      {/* Buổi tập: toàn chiều rộng để bảng đủ cột */}
      <div className="mt-8 space-y-4">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className={SECTION_TITLE}>Buổi tập</h2>
            <div role="radiogroup" aria-label="Lọc buổi tập" className="inline-flex rounded-full border border-stone/25 bg-white p-0.5">
              {SESSION_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={sessionFilter === option.value}
                  onClick={() => setSessionFilter(option.value)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    sessionFilter === option.value ? "bg-brass/15 font-medium text-brass-deep" : "text-ink hover:bg-black/[0.03]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <SessionTable
            sessions={visibleSessions}
            onSelect={setOpenSessionId}
            emptyText={
              status === "Draft"
                ? "Giáo án nháp chưa có buổi tập — áp dụng giáo án rồi xếp lịch tuần."
                : sessionFilter === "upcoming"
                  ? "Không có buổi tập sắp tới."
                  : "Chưa có buổi tập nào."
            }
          />
        </section>

        <p className="text-xs text-stone">
          Lập lúc {formatDateTime(plan.createdAt)}
          {plan.updatedAt && ` · Cập nhật lúc ${formatDateTime(plan.updatedAt)}`}
        </p>
      </div>

      {/* Sau thao tác trên 1 buổi: tải lại ngầm (tiến độ + danh sách buổi đổi theo) */}
      <SessionDrawer
        key={openSessionId ?? "closed"}
        sessionId={openSessionId}
        onClose={() => setOpenSessionId(null)}
        onChanged={planResource.refresh}
      />

      <ConfirmDialog
        open={Boolean(currentConfirm)}
        title={currentConfirm?.title ?? ""}
        message={currentConfirm?.message ?? ""}
        confirmLabel={currentConfirm?.confirmLabel}
        cancelLabel="Quay lại"
        danger={currentConfirm?.danger ?? true}
        loading={busy}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
