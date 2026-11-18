// MOCK: thay bằng API BE khi có PaymentStatus. BE chưa có trạng thái thanh toán chi phí / chi trả tiền thưởng, nên trang
// "Chi phí & tiền thưởng" của Chủ ngựa và Quản lý dùng chung lớp giả lập này (localStorage key "financePayments").
// Cô lập hoàn toàn: không chạm vào expenseService / ownerService / trainerService; nút "Reset dữ liệu demo" xóa key này
// (persistedStore.DEMO_KEYS).
//
// Mỗi chủ ngựa có trạng thái riêng cho từng kỳ: khóa = kind + ownerId + monthKey.
//   kind: "expense" (chi phí chủ trả CLB) | "reward" (tiền thưởng CLB trả chủ); ownerId: UserID chủ ngựa; monthKey: "YYYY-MM".
// Trạng thái: expense → "unpaid" | "transferred" (chủ báo đã chuyển, chờ quản lý xác nhận) | "paid" (quản lý đã xác nhận);
//             reward  → "pending" (chờ chi trả) | "received" (đã chi trả / đã nhận).
// "Quá hạn" KHÔNG lưu: suy ra ở giao diện từ "unpaid" + hạn thanh toán (utils/paymentDue.js).
import { toISODate } from "../utils/date";

const STORAGE_KEY = "financePayments";
const DATA_VERSION = 2; // v1 chưa có ownerId trong khóa → dữ liệu cũ bị bỏ qua và seed lại
const DEFAULT_STATUS = { expense: "unpaid", reward: "pending" };
// Demo: chủ ngựa này có kỳ chi phí mới nhất ở trạng thái "Chờ xác nhận" để thử luồng quản lý xác nhận (Đặng Minh Khoa)
const DEMO_TRANSFERRED_OWNER_ID = 6;

function readAll() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return parsed && parsed.version === DATA_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function writeAll(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Trình duyệt chặn / đầy bộ nhớ: vẫn chạy được, chỉ mất dữ liệu khi tải lại
  }
}

const emptyData = () => ({ version: DATA_VERSION, seededOwners: [], items: {} });
const keyOf = (kind, ownerId, monthKey) => `${kind}:${Number(ownerId)}:${monthKey}`;

// Ngày mùng `day` của tháng kế tiếp (ISO), vd ("2026-09", 8) → "2026-10-08"
function dayOfNextMonth(monthKey, day) {
  const [year, month] = monthKey.split("-").map(Number);
  return toISODate(new Date(year, month, day));
}

// Seed demo cho 1 chủ ngựa (mỗi chủ chỉ seed 1 lần, không ghi đè dữ liệu đã có). months: { expense: ["YYYY-MM", ...], reward: [...] }
// — các tháng có dữ liệu của chủ đó, thứ tự bất kỳ.
// Chi phí: tháng cũ nhất = đã thanh toán (mùng 8 tháng kế tiếp, quản lý xác nhận); các tháng còn lại = chưa thanh toán
// (tháng đã qua hạn tự hiện "Quá hạn"; tháng mới nhất giữ "chưa thanh toán"). Riêng chủ DEMO_TRANSFERRED_OWNER_ID: tháng mới nhất = chờ xác nhận.
// Tiền thưởng: tháng mới nhất = chờ chi trả; các tháng cũ hơn = đã chi trả.
export function seedDemoPayments(ownerId, months) {
  const data = readAll() ?? emptyData();
  if (data.seededOwners.includes(Number(ownerId))) return;
  const today = toISODate(new Date());
  const expenseMonths = [...(months.expense ?? [])].sort();
  expenseMonths.forEach((month, index) => {
    let entry = { status: "unpaid" };
    if (index === 0) entry = { status: "paid", paidAt: dayOfNextMonth(month, 8), confirmedBy: "Quản lý" };
    else if (index === expenseMonths.length - 1 && Number(ownerId) === DEMO_TRANSFERRED_OWNER_ID) {
      entry = { status: "transferred", transferredAt: today };
    }
    data.items[keyOf("expense", ownerId, month)] = entry;
  });
  const rewardMonths = [...(months.reward ?? [])].sort();
  rewardMonths.forEach((month, index) => {
    data.items[keyOf("reward", ownerId, month)] =
      index === rewardMonths.length - 1 ? { status: "pending" } : { status: "received", receivedAt: dayOfNextMonth(month, 5), confirmedBy: "Quản lý" };
  });
  data.seededOwners.push(Number(ownerId));
  writeAll(data);
}

// Trạng thái thanh toán của 1 kỳ của 1 chủ ngựa: { status, transferredAt?, paidAt?, receivedAt?, confirmedBy?, note? }
export function getPaymentState(kind, ownerId, monthKey) {
  const stored = readAll()?.items[keyOf(kind, ownerId, monthKey)];
  return stored ?? { status: DEFAULT_STATUS[kind] };
}

function update(kind, ownerId, monthKey, changes) {
  const data = readAll() ?? emptyData();
  const key = keyOf(kind, ownerId, monthKey);
  data.items[key] = { ...(data.items[key] ?? { status: DEFAULT_STATUS[kind] }), ...changes };
  writeAll(data);
  return data.items[key];
}

// Chủ ngựa báo đã chuyển khoản → "Chờ xác nhận". Chỉ áp dụng cho chi phí chưa thanh toán.
export function markTransferred(kind, ownerId, monthKey) {
  if (kind !== "expense") throw new Error("Chỉ chi phí mới có bước báo chuyển khoản.");
  if (getPaymentState(kind, ownerId, monthKey).status === "paid") throw new Error("Kỳ này đã được xác nhận thanh toán.");
  return update(kind, ownerId, monthKey, { status: "transferred", transferredAt: toISODate(new Date()) });
}

// Quản lý xác nhận đã nhận tiền (chi phí → "paid") hoặc đã chi trả tiền thưởng (reward → "received").
// options: { date (ISO, mặc định hôm nay), note (tùy chọn), confirmedBy (mặc định "Quản lý") }
export function confirmPayment(kind, ownerId, monthKey, { date = toISODate(new Date()), note = "", confirmedBy = "Quản lý" } = {}) {
  const common = { confirmedBy, note: note.trim() };
  return kind === "expense"
    ? update(kind, ownerId, monthKey, { status: "paid", paidAt: date, ...common })
    : update(kind, ownerId, monthKey, { status: "received", receivedAt: date, ...common });
}
