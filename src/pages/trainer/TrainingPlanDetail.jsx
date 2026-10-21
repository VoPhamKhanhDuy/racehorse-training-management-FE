import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import { ChevronDown } from "lucide-react";
import ActionMenu from "../../components/ActionMenu";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import ReadinessText from "../../components/ReadinessText";
import StatusText from "../../components/StatusText";
import TabFilter from "../../components/TabFilter";
import HorseFitnessPanel from "./HorseFitnessPanel";
import PlanInfoTable from "./PlanInfoTable";
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
import { formatKm, formatNumber } from "../../utils/trainingFormat";

const SECTION_TITLE = "font-serif text-xl font-semibold text-[#2b2118]";
const SESSION_FILTERS = [
  { code: "upcoming", label: "Sắp tới" },
  { code: "all", label: "Tất cả" },
];

// Chi tiết giáo án (GET /api/trainer/training-plans/{id}): thông tin chung, tiến độ, buổi tập, giai đoạn, thể trạng + thao tác theo trạng thái.
// Nút chính: Nháp → Áp dụng; Đang áp dụng → Xếp lịch tuần. Menu ⋯: Nháp → Xem trước lịch tuần, Sửa, Hủy giáo án, Xóa nháp;
// Đang áp dụng → Thêm buổi tập, Sửa thông tin, Kết thúc, Hủy giáo án.
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
  const [fitnessOpen, setFitnessOpen] = useState(false);
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

  const menuItems =
    status === "Draft"
      ? [
          { key: "preview", label: "Xem trước lịch tuần", to: `/trainer/plans/${plan.planId}/weekly-schedule` },
          { key: "edit", label: "Sửa", to: `/trainer/plans/${plan.planId}/edit` },
          { key: "cancel", label: "Hủy giáo án", onClick: () => setConfirmAction("cancel"), danger: true },
          { key: "delete", label: "Xóa nháp", onClick: () => setConfirmAction("delete"), danger: true },
        ]
      : [
          { key: "addSession", label: "Thêm buổi tập", to: `/trainer/plans/${plan.planId}/sessions/new` },
          { key: "edit", label: "Sửa thông tin", to: `/trainer/plans/${plan.planId}/edit` },
          { key: "complete", label: "Kết thúc", onClick: () => setConfirmAction("complete") },
          { key: "cancel", label: "Hủy giáo án", onClick: () => setConfirmAction("cancel"), danger: true },
        ];

  // Dòng tiến độ: "x/y buổi · z km" luôn hiện; sắp tới / đã hủy / điểm TB chỉ hiện khi khác 0 / có giá trị
  const progressParts = [
    `${progress.completedSessions ?? 0}/${progress.totalSessions ?? 0} buổi`,
    progress.upcomingSessions > 0 && `${progress.upcomingSessions} sắp tới`,
    progress.cancelledSessions > 0 && `${progress.cancelledSessions} đã hủy`,
    progress.averagePerformanceScore != null && `Điểm TB ${formatNumber(progress.averagePerformanceScore)}`,
    formatKm(progress.totalActualDistanceKm ?? 0),
  ].filter(Boolean);

  const fitness = fitnessState.fitness;
  // Chỉ hiển thị: tiến độ ẩn với giáo án nháp chưa có buổi nào; tab lọc buổi tập ẩn với giáo án nháp chưa có buổi nào
  const draftWithoutSessions = status === "Draft" && plan.sessions.length === 0;
  const showProgress = status !== "Draft" || (progress.totalSessions ?? 0) > 0;

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link to="/trainer/plans" className="text-sm font-medium text-[#c2570c] hover:underline">
        ← Giáo án tập luyện
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-tight text-[#2b2118]">{plan.planName}</h1>
          <span className="[&>span]:text-[15px]">
            <StatusText code={status}>{label("planStatuses", status)}</StatusText>
          </span>
        </div>

        {(status === "Draft" || status === "Active") && (
          <div className="flex items-center gap-2">
            {status === "Draft" ? (
              <button type="button" onClick={() => setConfirmAction("activate")} className="btn-primary">
                Áp dụng
              </button>
            ) : (
              <Link to={`/trainer/plans/${plan.planId}/weekly-schedule`} className="btn-primary">
                Xếp lịch tuần
              </Link>
            )}
            <ActionMenu items={menuItems} />
          </div>
        )}
      </div>

      {(message || actionError) && (
        <div className="mt-4 space-y-3">
          {message && (
            <div className="flex min-h-11 items-center justify-between gap-4 rounded-sm border border-[#cfd8b4] border-l-[3px] border-l-[#6b7a3a] bg-[#f6f8ee] px-4 py-2 text-sm text-[#3f5420]">
              {message}
              <button type="button" onClick={() => setMessage("")} className="cursor-pointer font-medium text-[#3f5420] hover:underline">
                Đóng
              </button>
            </div>
          )}
          <ApiErrorNotice error={actionError} />
        </div>
      )}

      <div className="mt-6">
        <PlanInfoTable plan={plan} />
      </div>

      {showProgress && (
        <div className="mt-6" aria-label="Tiến độ">
          <div className="h-1 overflow-hidden rounded-sm bg-[#ece5d6]">
            <div className="h-full rounded-sm bg-[#6b7a3a]" style={{ width: `${Math.min(100, Number(progress.completionRate) || 0)}%` }} />
          </div>
          <p className="mt-2 text-sm text-[#2b2118] tabular-nums">{progressParts.join(" · ")}</p>
        </div>
      )}

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 className={SECTION_TITLE}>Buổi tập</h2>
          {!draftWithoutSessions && (
            <TabFilter ariaLabel="Lọc buổi tập" options={SESSION_FILTERS} value={sessionFilter} onChange={setSessionFilter} />
          )}
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

      <section className="mt-10">
        <h2 className={`${SECTION_TITLE} mb-3`}>Giai đoạn</h2>
        <PlanPhaseTable phases={plan.phases} markCurrent={status === "Active"} variant="framed" />
      </section>

      <section className="mt-10">
        <button
          type="button"
          onClick={() => setFitnessOpen((prev) => !prev)}
          aria-expanded={fitnessOpen}
          aria-controls="plan-fitness"
          className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded border border-[#b9ab90] bg-white px-4 text-left transition-colors hover:bg-[#f0efec]"
        >
          <h2 className="font-serif text-lg font-semibold text-[#2b2118]">Thể trạng hiện tại</h2>
          {fitnessState.loading ? (
            <span className="text-sm text-[#6b6055]">Đang đánh giá...</span>
          ) : (
            fitness && <ReadinessText code={fitness.readiness}>{fitness.readinessLabel}</ReadinessText>
          )}
          <ChevronDown
            className={`ml-auto h-4 w-4 shrink-0 text-[#6b6055] transition-transform ${fitnessOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {fitnessOpen && (
          <div id="plan-fitness" className="mt-2">
            <HorseFitnessPanel
              fitness={fitness}
              loading={fitnessState.loading}
              error={fitnessState.error}
              onRefresh={fitnessState.reload}
              showHeader={false}
              layout="table"
            />
          </div>
        )}
      </section>

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
