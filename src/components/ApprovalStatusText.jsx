import { approvalColor, approvalLabel } from "../utils/planStatus";

// Trạng thái duyệt của kế hoạch (Nháp / Chờ chủ ngựa duyệt / Đã đồng ý / Cần chỉnh sửa) — chữ đậm, không nền, cùng kiểu StatusText
export default function ApprovalStatusText({ status, label }) {
  return <span className={`text-sm font-semibold whitespace-nowrap ${approvalColor(status)}`}>{label ?? approvalLabel(status)}</span>;
}
