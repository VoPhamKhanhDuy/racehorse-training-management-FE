import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CLUB_BANK, CLUB_INFO } from "../../config/clubBank";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

// Loại chứng từ → tiêu đề thanh trên, tên in trên tờ, nhãn người nhận
const KINDS = {
  invoice: { barTitle: "Hóa đơn", heading: "HÓA ĐƠN", partyLabel: "Gửi tới" },
  receipt: { barTitle: "Biên nhận thanh toán", heading: "BIÊN NHẬN THANH TOÁN", partyLabel: "Gửi tới" },
  payout: { barTitle: "Phiếu chi tiền thưởng", heading: "PHIẾU CHI TIỀN THƯỞNG", partyLabel: "Chi trả cho" },
};

// Khung xem chứng từ (hóa đơn / biên nhận / phiếu chi): modal 720px, tờ giấy trắng cuộn dọc nếu dài. Render qua portal vào <body>
// để khi in (@media print trong styles/index.css) chỉ còn tờ giấy. Đóng bằng nút "Đóng", phím Esc hoặc bấm ra ngoài.
// props: kind; number, date (số + ngày chứng từ); ownerName; monthLabel ("Tháng 10/2026"); rows [{ key, date, content, horse, amount }];
// total; invoiceNumber (biên nhận); dueDate, status { label, color }, transferContent (hóa đơn); paidDate (biên nhận / phiếu chi).
export default function DocumentViewer({ kind, number, date, ownerName, monthLabel, rows, total, invoiceNumber, dueDate, status, transferContent, paidDate, onClose }) {
  const closeRef = useRef(null);
  const meta = KINDS[kind];

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, [onClose]);

  const confirmation =
    kind === "receipt"
      ? `Đã nhận số tiền ${formatCurrency(total)} cho hóa đơn ${invoiceNumber} ngày ${formatDate(paidDate)}. Người xác nhận: Quản lý câu lạc bộ.`
      : kind === "payout"
        ? `Đã chi trả số tiền ${formatCurrency(total)} tiền thưởng ${monthLabel.toLocaleLowerCase("vi")} cho chủ ngựa ngày ${formatDate(paidDate)}. Người xác nhận: Quản lý câu lạc bộ.`
        : null;

  return createPortal(
    <div id="document-print-root" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="doc-no-print absolute inset-0 bg-[#232328]/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${meta.barTitle} ${number}`}
        className="doc-modal relative flex max-h-[92vh] w-full max-w-[720px] flex-col rounded-[4px] bg-[#e9e6e0] p-4"
      >
        {/* Thanh trên cùng (ngoài tờ giấy, không in) */}
        <div className="doc-no-print flex shrink-0 flex-wrap items-center justify-between gap-3 pb-3">
          <p className="text-[15px] font-semibold text-[#2b2118]">
            {meta.barTitle} {number}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className={`h-10 cursor-pointer rounded-[4px] bg-[#c2570c] px-4 text-[15px] font-semibold text-white transition-colors hover:bg-[#a8480a] ${FOCUS_RING}`}
            >
              In / Lưu PDF
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className={`h-10 cursor-pointer rounded-[4px] border border-[#cfc4ad] bg-white px-4 text-[15px] font-semibold text-[#2b2118] transition-colors hover:bg-[#f0efec] ${FOCUS_RING}`}
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Tờ chứng từ */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <article id="document-sheet" className="border border-[#b9ab90] bg-white p-10 text-[#2b2118]">
            <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-[#2b2118] pb-5">
              <div>
                <p className="font-serif text-xl font-semibold">{CLUB_INFO.name}</p>
                <p className="text-[13px] text-[#6b6055]">{CLUB_INFO.address}</p>
              </div>
              <div className="text-right">
                <h2 className="font-serif text-2xl font-semibold">{meta.heading}</h2>
                <p className="text-sm">Số: {number}</p>
                <p className="text-sm">Ngày: {formatDate(date)}</p>
              </div>
            </header>

            <section className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-[#6b6055]">{meta.partyLabel}: </span>
                <span className="font-semibold">{ownerName}</span>
              </p>
              <p>
                <span className="text-[#6b6055]">Kỳ: </span>
                <span className="font-semibold">{monthLabel}</span>
              </p>
            </section>

            {/* Chứng từ → dùng <table> */}
            <table className="mt-5 w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-[#2b2118] text-[13px] font-bold">
                  <th className="px-1 py-2 whitespace-nowrap">Ngày</th>
                  <th className="px-2 py-2">Nội dung</th>
                  <th className="px-2 py-2">Ngựa</th>
                  <th className="px-1 py-2 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-b border-[#d9cfba] align-top">
                    <td className="px-1 py-2 whitespace-nowrap tabular-nums">{formatDate(row.date)}</td>
                    <td className="px-2 py-2">{row.content}</td>
                    <td className="px-2 py-2">{row.horse}</td>
                    <td className="px-1 py-2 text-right whitespace-nowrap tabular-nums">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#2b2118]">
                  <td colSpan={3} className="px-1 pt-3 font-serif text-lg font-semibold">
                    Tổng cộng
                  </td>
                  <td className="px-1 pt-3 text-right font-serif text-[22px] font-semibold whitespace-nowrap tabular-nums">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>

            {kind === "invoice" && (
              <section className="mt-6 space-y-1 text-sm">
                <p>
                  Hạn thanh toán: <span className="font-semibold tabular-nums">{formatDate(dueDate)}</span>
                </p>
                <p>
                  Trạng thái: <span className="font-semibold" style={{ color: status.color }}>{status.label}</span>
                </p>
                <div className="pt-3">
                  <p className="font-semibold">Thông tin chuyển khoản</p>
                  <p>
                    <span className="text-[#6b6055]">Ngân hàng: </span>
                    {CLUB_BANK.bankName}
                  </p>
                  <p>
                    <span className="text-[#6b6055]">Số tài khoản: </span>
                    {CLUB_BANK.accountNo}
                  </p>
                  <p>
                    <span className="text-[#6b6055]">Chủ tài khoản: </span>
                    {CLUB_BANK.accountName}
                  </p>
                  <p>
                    <span className="text-[#6b6055]">Nội dung chuyển khoản: </span>
                    <span className="font-mono font-semibold">{transferContent}</span>
                  </p>
                </div>
              </section>
            )}

            {confirmation && <p className="mt-6 text-sm leading-relaxed">{confirmation}</p>}

            <footer className="mt-8 border-t border-[#d9cfba] pt-3 text-xs text-[#6b6055]">
              Chứng từ nội bộ của câu lạc bộ, không phải hóa đơn giá trị gia tăng.
            </footer>
          </article>
        </div>
      </div>
    </div>,
    document.body
  );
}
