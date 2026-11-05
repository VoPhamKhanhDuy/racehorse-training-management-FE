// Trạng thái DUYỆT của kế hoạch huấn luyện (luồng Trainer gửi → Chủ ngựa duyệt).
// Khác PlanStatus của giáo án (Draft / Active / Completed / Cancelled — vòng đời thực hiện): đây là lớp duyệt đặt lên trên.
// Mã khớp hợp đồng API dự kiến: Draft → PendingOwner → Approved | ChangesRequested.
export const PLAN_APPROVAL = {
  DRAFT: "Draft",
  PENDING: "PendingOwner",
  APPROVED: "Approved",
  CHANGES: "ChangesRequested",
  REJECTED: "Rejected",
};

const LABELS = {
  [PLAN_APPROVAL.DRAFT]: "Nháp",
  [PLAN_APPROVAL.PENDING]: "Chờ chủ ngựa duyệt",
  [PLAN_APPROVAL.APPROVED]: "Đã đồng ý",
  [PLAN_APPROVAL.CHANGES]: "Cần chỉnh sửa",
  [PLAN_APPROVAL.REJECTED]: "Đã bị từ chối",
};

// Màu chữ lấy từ bảng màu trạng thái có sẵn (StatusText), không thêm màu mới
const COLORS = {
  [PLAN_APPROVAL.DRAFT]: "text-[#6b6055]",
  [PLAN_APPROVAL.PENDING]: "text-[#1f1f1f]",
  [PLAN_APPROVAL.APPROVED]: "text-[#4d6b2a]",
  [PLAN_APPROVAL.CHANGES]: "text-[#c2570c]",
  [PLAN_APPROVAL.REJECTED]: "text-[#4a3f33]",
};

export function approvalLabel(status) {
  return LABELS[status] ?? LABELS[PLAN_APPROVAL.DRAFT];
}

export function approvalColor(status) {
  return COLORS[status] ?? COLORS[PLAN_APPROVAL.DRAFT];
}

// Trainer gửi (hoặc gửi lại) được khi kế hoạch còn Nháp hoặc chủ ngựa yêu cầu chỉnh sửa
export function canSendToOwner(status) {
  return status === PLAN_APPROVAL.DRAFT || status === PLAN_APPROVAL.CHANGES;
}

// Chỉ giao lịch tập cho Groom khi chủ ngựa đã đồng ý
export function canAssignGroom(status) {
  return status === PLAN_APPROVAL.APPROVED;
}

// Chỉ Áp dụng giáo án (bước giao lịch cho Groom) khi chủ ngựa đã đồng ý
export const canApplyPlan = canAssignGroom;

export const APPLY_LOCK_HINT = "Cần chủ ngựa đồng ý trước khi áp dụng";

// Thông báo xanh sau khi lập giáo án — nội dung theo trạng thái duyệt hiện tại
export function approvalNotice(status) {
  switch (status) {
    case PLAN_APPROVAL.PENDING:
      return "Đã gửi chủ ngựa, đang chờ phản hồi.";
    case PLAN_APPROVAL.CHANGES:
      return "Chủ ngựa yêu cầu chỉnh sửa, xem lý do bên dưới.";
    case PLAN_APPROVAL.APPROVED:
      return "Chủ ngựa đã đồng ý. Bấm Áp dụng để bắt đầu.";
    case PLAN_APPROVAL.REJECTED:
      return "Chủ ngựa đã từ chối kế hoạch, xem lý do bên dưới.";
    default:
      return "Đã lập giáo án. Gửi chủ ngựa duyệt, sau khi chủ ngựa đồng ý mới Áp dụng được.";
  }
}

export const GROOM_LOCK_HINT = "Cần chủ ngựa đồng ý trước khi giao lịch";
