// Luồng "Đăng ký thi đấu" nhiều bước: Trainer tạo → Chủ ngựa đồng ý / từ chối → Quản lý duyệt / từ chối.
// Từ chối ở bất kỳ bước nào kết thúc luồng; Trainer muốn thử lại thì tạo đăng ký mới. Không có bước thú y (thú y chỉ cung cấp
// thông tin sức khỏe / khóa tập để chủ ngựa và quản lý cân nhắc).
export const RR_STATUS = {
  DRAFT: "Draft",
  PENDING_OWNER: "PendingOwner",
  PENDING_MANAGER: "PendingManager",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
};

export const RR_NOTE_MAX = 300;
export const RR_DEADLINE_DAYS_BEFORE = 7; // chưa có dữ liệu thật: hạn đăng ký = 7 ngày trước ngày đua (BE cần trả registrationDeadline)

// Vai trò → trạng thái đang chờ chính vai trò đó xử lý (dùng cho chấm "việc cần làm" và huy hiệu menu)
export const ACTION_STATUS_BY_ROLE = {
  head_trainer: RR_STATUS.DRAFT,
  horse_owner: RR_STATUS.PENDING_OWNER,
  club_manager: RR_STATUS.PENDING_MANAGER,
};

const ROLE_NAMES = { Owner: "chủ ngựa", Manager: "quản lý" };

// Nhãn "bước hiện tại" ở cột bảng
export function stepText(record) {
  switch (record.status) {
    case RR_STATUS.DRAFT:
      return "Nháp";
    case RR_STATUS.PENDING_OWNER:
      return "Chờ chủ ngựa duyệt";
    case RR_STATUS.PENDING_MANAGER:
      return "Chờ quản lý duyệt";
    case RR_STATUS.APPROVED:
      return "Đã duyệt";
    case RR_STATUS.REJECTED:
      return `Bị ${ROLE_NAMES[record.rejectedBy] ?? "người duyệt"} từ chối`;
    case RR_STATUS.WITHDRAWN:
      return "Đã rút";
    case RR_STATUS.EXPIRED:
      return "Hết hạn";
    default:
      return record.status;
  }
}

// Trạng thái của từng bước trong "Tiến trình duyệt" (chỉ còn 2 bước: Chủ ngựa, Quản lý)
export function stepProgress(record) {
  const { status, rejectedBy } = record;
  const closed = [RR_STATUS.WITHDRAWN, RR_STATUS.EXPIRED].includes(status);
  const decision = (step) => record.history.filter((h) => h.step === step && ["Đồng ý", "Duyệt", "Từ chối"].includes(h.action)).at(-1);
  const owner = decision("Owner");
  const manager = decision("Manager");

  const ownerState =
    owner?.action === "Từ chối"
      ? "Từ chối"
      : owner
        ? "Đã đồng ý"
        : status === RR_STATUS.PENDING_OWNER
          ? "Đang chờ"
          : closed
            ? "Chưa thực hiện"
            : "Chưa tới";
  const managerState =
    manager?.action === "Từ chối"
      ? "Từ chối"
      : manager
        ? "Đã duyệt"
        : status === RR_STATUS.PENDING_MANAGER
          ? "Đang chờ"
          : closed || (status === RR_STATUS.REJECTED && rejectedBy === "Owner")
            ? "Chưa thực hiện"
            : "Chưa tới";

  return [
    { key: "Owner", label: "Chủ ngựa", state: ownerState, entry: owner },
    { key: "Manager", label: "Quản lý", state: managerState, entry: manager },
  ];
}
