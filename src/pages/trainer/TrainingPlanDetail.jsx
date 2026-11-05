import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import { ChevronDown } from "lucide-react";
import ActionMenu from "../../components/ActionMenu";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import ReadinessText from "../../components/ReadinessText";
import TabFilter from "../../components/TabFilter";
import ApplyPlanDialog from "./ApplyPlanDialog";
import HorseFitnessPanel from "./HorseFitnessPanel";
import PlanInfoTable from "./PlanInfoTable";
import PlanPhaseTable from "./PlanPhaseTable";
import SessionDrawer from "./SessionDrawer";
import SessionTable from "./SessionTable";
import useApiResource from "../../hooks/useApiResource";
import useAuth from "../../hooks/useAuth";
import useHorseFitness from "../../hooks/useHorseFitness";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import {
  activateTrainingPlan,
  cancelTrainingPlan,
  completeTrainingPlan,
  deleteTrainingPlan,
  getTrainingPlan,
} from "../../services/trainingApi";
import { setPlanGroom } from "../../services/planGroomMock";
import {
  clearPlanApproval,
  getPlanApproval,
  markNoticesRead,
  sendPlanToOwner,
  subscribePlanApprovals,
  syncPlanSessions,
} from "../../services/planApprovalMock";
import { APPLY_LOCK_HINT, PLAN_APPROVAL, approvalLabel, approvalNotice, canApplyPlan, canSendToOwner } from "../../utils/planStatus";
import { formatKm, formatNumber } from "../../utils/trainingFormat";

const SECONDARY_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-sm border border-stone/25 bg-white px-5 text-sm font-semibold whitespace-nowrap text-ink transition-colors hover:border-stone/50";
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
  const { user } = useAuth();
  // Vừa lập giáo án (state.created): thông báo xanh lấy theo trạng thái duyệt hiện tại thay vì chuỗi cố định
  const [message, setMessage] = useState(state?.created ? "" : (state?.message ?? ""));
  const [statusNotice, setStatusNotice] = useState(Boolean(state?.created));
  const [actionError, setActionError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // "activate" | "complete" | "cancel" | "delete" | "send"
  const [busy, setBusy] = useState(false);
  const [sessionFilter, setSessionFilter] = useState("upcoming");
  const [openSessionId, setOpenSessionId] = useState(null);
  const [fitnessOpen, setFitnessOpen] = useState(false);
  const planResource = useApiResource(() => getTrainingPlan(id), id);
  const { data: plan, loading, error: loadError } = planResource;
  const fitnessState = useHorseFitness(plan?.horseId);
  // Trạng thái duyệt của chủ ngựa (MOCK — services/planApprovalMock.js)
  const approvalResource = useApiResource(() => getPlanApproval(id), id);

  // Kế hoạch đã đồng ý: chép danh sách buổi tập sang mock để Chủ ngựa thấy ở "Sắp tới" (cầu nối tạm, xem planApprovalMock.js)
  useEffect(() => {
    if (planResource.data) syncPlanSessions(planResource.data);
  }, [planResource.data, approvalResource.data?.status]);

  // Mở kế hoạch = đã xem thông báo của kế hoạch này; chủ ngựa vừa quyết định (cùng trình duyệt) thì tải lại
  useEffect(() => {
    markNoticesRead("head_trainer", { planId: id });
    return subscribePlanApprovals(() => {
      markNoticesRead("head_trainer", { planId: id });
      approvalResource.refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <LoadingState />;
  if (loadError) return <ApiErrorNotice variant="page" error={loadError} onRetry={planResource.reload} />;

  const { status, progress = {} } = plan;
  const approval = approvalResource.data ?? { status: PLAN_APPROVAL.DRAFT, note: "" };
  const approvalStatus = approval.status;
  const showApproval = status === "Draft" || status === "Active";
  const canSend = showApproval && canSendToOwner(approvalStatus);
  const rejected = showApproval && approvalStatus === PLAN_APPROVAL.REJECTED;
  const applyAllowed = canApplyPlan(approvalStatus);
  const noticeText = message || (statusNotice && showApproval ? approvalNotice(approvalStatus) : "");
  const upcomingCount = plan.sessions.filter((s) => s.status === "Scheduled").length;
  const visibleSessions =
    sessionFilter === "upcoming" ? plan.sessions.filter((s) => s.status === "Scheduled" || s.status === "InProgress") : plan.sessions;

  const confirmConfig = {
    send: {
      title: "Gửi chủ ngựa",
      message: `Gửi kế hoạch "${plan.planName}" cho chủ ngựa duyệt?`,
      confirmLabel: "Gửi",
      danger: false,
      run: () => sendPlanToOwner(plan, user.fullName),
      done: "Đã gửi kế hoạch cho chủ ngựa. Trạng thái: Chờ chủ ngựa duyệt.",
    },
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
      title: rejected ? "Xóa kế hoạch" : "Xóa giáo án nháp",
      message: `Xóa hẳn ${rejected ? "kế hoạch" : "giáo án nháp"} "${plan.planName}" và các giai đoạn của nó? Thao tác này không thể hoàn tác.`,
      confirmLabel: "Xóa",
      danger: true,
      run: async () => {
        const result = await deleteTrainingPlan(plan.planId);
        await clearPlanApproval(plan.planId);
        return result;
      },
      done: `Đã xóa giáo án nháp "${plan.planName}".`,
    },
  };
  // "Áp dụng" dùng khung riêng có bước chọn Groom (bắt buộc); các hành động khác dùng hộp xác nhận chung
  const currentConfirm = confirmAction && confirmAction !== "activate" ? confirmConfig[confirmAction] : null;

  // Áp dụng + nhớ Groom được chọn (xếp lịch tuần sẽ giao các buổi cho người này). Kiểm tra điều kiện ở đây, không chỉ ở nút.
  const handleApply = async (groom) => {
    if (!canApplyPlan(approvalStatus)) throw new Error(`${APPLY_LOCK_HINT}.`);
    setBusy(true);
    setActionError(null);
    setMessage("");
    setStatusNotice(false);
    try {
      const updated = await activateTrainingPlan(plan.planId);
      setPlanGroom(plan.planId, groom);
      planResource.setData(updated);
      fitnessState.reload();
      setMessage(`Đã áp dụng giáo án, giao cho ${groom.fullName}. Bấm "Xếp lịch tuần" để sinh các buổi tập.`);
      setConfirmAction(null);
    } finally {
      setBusy(false);
    }
  };

  // Bị từ chối → đưa về Nháp (bản ghi duyệt được dọn) rồi mở form sửa để soạn lại và gửi chủ ngựa lần nữa
  const handleReopen = async () => {
    await clearPlanApproval(plan.planId);
    navigate(`/trainer/plans/${plan.planId}/edit`);
  };

  const handleConfirm = async () => {
    const action = confirmAction;
    // Chặn ở cả hàm xử lý, không chỉ ở nút: chưa Đã đồng ý thì không áp dụng được
    if (action === "activate" && !canApplyPlan(approvalStatus)) {
      setActionError({ message: `${APPLY_LOCK_HINT}.` });
      setConfirmAction(null);
      return;
    }
    setBusy(true);
    setActionError(null);
    setMessage("");
    setStatusNotice(false);
    try {
      const updated = await confirmConfig[action].run();
      if (action === "delete") {
        navigate("/trainer/plans", { state: { message: confirmConfig.delete.done } });
        return;
      }
      if (action === "send") {
        approvalResource.setData(updated);
      } else {
        planResource.setData(updated);
        fitnessState.reload();
      }
      setMessage(confirmConfig[action].done);
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  const menuItemsAll =
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

  // Kế hoạch bị từ chối không sửa trực tiếp: phải bấm "Chỉnh sửa và gửi lại" (đưa về Nháp) ở khung lý do
  const menuItems = rejected ? menuItemsAll.filter((item) => item.key !== "edit") : menuItemsAll;

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
        </div>

        {(status === "Draft" || status === "Active") && (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              {canSend && (
                <button type="button" onClick={() => setConfirmAction("send")} className="btn-primary">
                  Gửi chủ ngựa
                </button>
              )}
              {rejected && (
                <button
                  type="button"
                  disabled
                  className={`${SECONDARY_BUTTON} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-stone/25`}
                >
                  Gửi chủ ngựa
                </button>
              )}
              {status === "Draft" ? (
                <button
                  type="button"
                  onClick={() => setConfirmAction("activate")}
                  disabled={!applyAllowed}
                  title={applyAllowed ? undefined : APPLY_LOCK_HINT}
                  className={
                    applyAllowed
                      ? "btn-primary"
                      : `${SECONDARY_BUTTON} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-stone/25`
                  }
                >
                  Áp dụng
                </button>
              ) : (
                <Link to={`/trainer/plans/${plan.planId}/weekly-schedule`} className={canSend ? SECONDARY_BUTTON : "btn-primary"}>
                  Xếp lịch tuần
                </Link>
              )}
              <ActionMenu items={menuItems} />
            </div>
            {status === "Draft" && !applyAllowed && (
              <p className="text-[13px] text-stone">
                {approvalStatus === PLAN_APPROVAL.PENDING
                  ? `Đang ${approvalLabel(approvalStatus).toLowerCase()}`
                  : rejected
                    ? "Chủ ngựa đã từ chối kế hoạch này"
                    : APPLY_LOCK_HINT}
              </p>
            )}
          </div>
        )}
      </div>

      {showApproval && approvalStatus === PLAN_APPROVAL.CHANGES && (
        <div className="mt-4 rounded-sm border border-l-[3px] border-stone/20 border-l-[#c2570c] bg-white px-4 py-3 text-sm text-ink">
          <p className="font-semibold text-[#c2570c]">Chủ ngựa yêu cầu chỉnh sửa</p>
          <p className="mt-1 whitespace-pre-line">{approval.note}</p>
          <p className="mt-2 text-[13px] text-stone">Sửa kế hoạch rồi bấm "Gửi chủ ngựa" để gửi lại.</p>
        </div>
      )}

      {rejected && (
        <div className="mt-4 rounded-sm border border-l-[3px] border-stone/20 border-l-[#4a3f33] bg-white px-4 py-3 text-sm text-ink">
          <p className="font-semibold text-[#4a3f33]">Chủ ngựa đã từ chối kế hoạch</p>
          <p className="mt-1 whitespace-pre-line">{approval.note}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleReopen} className="btn-primary">
              Chỉnh sửa và gửi lại
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction("delete")}
              className="inline-flex h-10 cursor-pointer items-center rounded-sm border border-[#9e5954]/40 bg-white px-5 text-sm font-semibold text-[#9e5954] transition-colors hover:border-[#9e5954] hover:bg-[#9e5954]/10"
            >
              Xóa kế hoạch
            </button>
          </div>
        </div>
      )}

      {(noticeText || actionError) && (
        <div className="mt-4 space-y-3">
          {noticeText && (
            <div className="flex min-h-11 items-center justify-between gap-4 rounded-sm border border-[#cfd8b4] border-l-[3px] border-l-[#6b7a3a] bg-[#f6f8ee] px-4 py-2 text-sm text-[#3f5420]">
              {noticeText}
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setStatusNotice(false);
                }} className="cursor-pointer font-medium text-[#3f5420] hover:underline">
                Đóng
              </button>
            </div>
          )}
          <ApiErrorNotice error={actionError} />
        </div>
      )}

      <div className="mt-6">
        <PlanInfoTable plan={plan} approvalStatus={showApproval ? approvalStatus : undefined} />
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

      {confirmAction === "activate" && <ApplyPlanDialog plan={plan} busy={busy} onApply={handleApply} onClose={() => setConfirmAction(null)} />}

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
