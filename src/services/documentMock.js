// MOCK: thay bằng InvoiceNo/ReceiptNo/IssuedAt từ BE khi có. BE chưa có số chứng từ, nên FE tự tính từ tháng + mã chủ ngựa
// (hàm thuần, kết quả ổn định mỗi lần mở; không lưu gì, không gọi API).
//   Hóa đơn   HD-{YYYY}{MM}-{MÃ CHỦ}: ngày lập = ngày cuối tháng chi phí.
//   Biên nhận BN-{YYYY}{MM}-{MÃ CHỦ}: chi phí đã thanh toán, ngày = ngày thanh toán.
//   Phiếu chi PC-{YYYY}{MM}-{MÃ CHỦ}: tiền thưởng đã nhận, ngày = ngày nhận.
import { toISODate } from "../utils/date";
import { getOwnerCode } from "../utils/paymentTransfer";

const compactMonth = (monthKey) => `${monthKey.slice(0, 4)}${monthKey.slice(5, 7)}`;
const numberOf = (prefix, monthKey, user) => `${prefix}-${compactMonth(monthKey)}-${getOwnerCode(user)}`;

// Ngày cuối cùng của tháng "YYYY-MM" (ISO)
function lastDayOfMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return toISODate(new Date(year, month, 0));
}

export const getInvoiceNumber = (monthKey, user) => numberOf("HD", monthKey, user);

export const getInvoice = (monthKey, user) => ({ number: getInvoiceNumber(monthKey, user), date: lastDayOfMonth(monthKey) });

// paidAt: ngày thanh toán (từ paymentMock)
export const getReceipt = (monthKey, user, paidAt) => ({ number: numberOf("BN", monthKey, user), date: paidAt });

// receivedAt: ngày nhận tiền thưởng (từ paymentMock)
export const getPayoutVoucher = (monthKey, user, receivedAt) => ({ number: numberOf("PC", monthKey, user), date: receivedAt });
