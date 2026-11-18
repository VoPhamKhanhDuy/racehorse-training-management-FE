import { PLAN_APPROVAL } from "../../utils/planStatus";

// Trạng thái duyệt kế hoạch trên Lịch trình của Chủ ngựa: chữ đậm 600, không nền / viền. Màu có sẵn trong hệ thống.
const STATUSES = {
  [PLAN_APPROVAL.PENDING]: { text: "Chờ bạn duyệt", className: "text-[#c2570c]" },
  [PLAN_APPROVAL.APPROVED]: { text: "Đã đồng ý", className: "text-[#4d6b2a]" },
  [PLAN_APPROVAL.CHANGES]: { text: "Đã yêu cầu chỉnh sửa", className: "text-[#4a3f33]" },
  [PLAN_APPROVAL.REJECTED]: { text: "Đã từ chối", className: "text-[#4a3f33]" },
};

export default function OwnerPlanApprovalStatus({ status, small = false }) {
  const item = STATUSES[status];
  if (!item) return null;
  return <span className={`${small ? "block text-[13px]" : "text-sm"} font-semibold ${item.className}`}>{item.text}</span>;
}
