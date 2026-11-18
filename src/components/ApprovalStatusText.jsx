import { PLAN_APPROVAL, approvalLabel } from "../utils/planStatus";

const APPROVAL_BADGE_STYLES = {
  [PLAN_APPROVAL.DRAFT]: {
    pill: "bg-[#f3efe8] text-[#6b6055]",
    dot: "bg-[#8a7f6e]",
  },
  [PLAN_APPROVAL.PENDING]: {
    pill: "bg-[#fdf3e7] text-[#c2570c]",
    dot: "bg-[#d97724]",
  },
  [PLAN_APPROVAL.APPROVED]: {
    pill: "bg-[#eef4e8] text-[#4d6b2a]",
    dot: "bg-[#5f7d37]",
  },
  [PLAN_APPROVAL.CHANGES]: {
    pill: "bg-[#fdf3e7] text-[#c2570c]",
    dot: "bg-[#c2570c]",
  },
  [PLAN_APPROVAL.REJECTED]: {
    pill: "bg-[#fbeae8] text-[#b3473f]",
    dot: "bg-[#c25048]",
  },
};

export default function ApprovalStatusText({ status, label }) {
  const style = APPROVAL_BADGE_STYLES[status] ?? APPROVAL_BADGE_STYLES[PLAN_APPROVAL.DRAFT];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      {label ?? approvalLabel(status)}
    </span>
  );
}
