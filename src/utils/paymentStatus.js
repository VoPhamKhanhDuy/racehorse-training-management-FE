import { Check, Clock, TriangleAlert } from "lucide-react";
import { getPaymentState } from "../services/paymentMock";
import { daysBetween, todayISO } from "./date";
import { getDueDate } from "./paymentDue";

// Trạng thái hiển thị của 1 kỳ (chữ màu + icon, không nền), dùng chung cho trang Chủ ngựa và Quản lý.
// "overdue" không lưu: suy ra từ "unpaid" + hạn thanh toán. Nhãn "received" của tiền thưởng khác nhau theo phía
// (Chủ ngựa: "Đã nhận", Quản lý: "Đã chi trả") nên bên Quản lý tự ghi đè nhãn.
export const STATUS_VIEW = {
  paid: { label: "Đã thanh toán", color: "#4d6b2a", Icon: Check },
  transferred: { label: "Chờ xác nhận", color: "#c2570c", Icon: Clock },
  overdue: { label: "Quá hạn", color: "#c0262d", Icon: TriangleAlert },
  unpaid: { label: "Chưa thanh toán", color: "#6b6055", Icon: null },
  received: { label: "Đã nhận", color: "#4d6b2a", Icon: Check },
  pending: { label: "Chờ chi trả", color: "#c2570c", Icon: Clock },
};

// Khóa trạng thái của 1 kỳ → khóa trong STATUS_VIEW. kind: "expense" | "reward"
// (expense: paid / transferred / overdue / unpaid; reward: received / pending)
export function periodStatus(kind, ownerId, month, today = todayISO()) {
  const state = getPaymentState(kind, ownerId, month);
  if (kind === "reward") return state.status === "received" ? "received" : "pending";
  if (state.status === "paid") return "paid";
  if (state.status === "transferred") return "transferred";
  // TODO: DueDate từ BE (hiện tạm tính trong utils/paymentDue.js)
  return daysBetween(today, getDueDate(month)) < 0 ? "overdue" : "unpaid";
}
