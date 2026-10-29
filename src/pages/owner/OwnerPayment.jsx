import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import { CLUB_BANK } from "../../config/clubBank";
import { getExpenses } from "../../services/expenseService";
import { getOwnerHorses } from "../../services/ownerService";
// MOCK: trạng thái thanh toán (BE chưa có) — cô lập trong services/paymentMock.js
import { getPaymentState, markTransferred } from "../../services/paymentMock";
import { formatCurrency } from "../../utils/currency";
import { getTransferContent } from "../../utils/paymentTransfer";
import { toUserID } from "../../utils/userId";

const COPIED_MS = 1500;
const FINANCE_PATH = "/owner/finance";
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";
const STEPS = [
  "Mở ứng dụng ngân hàng và chọn quét mã QR.",
  "Kiểm tra tên người nhận, số tiền và nội dung chuyển khoản.",
  "Hoàn tất chuyển khoản, quay lại đây và bấm “Xác nhận”.",
];

// Trang thanh toán chi phí 1 tháng (/owner/finance/pay/:monthKey): mã QR VietQR + thông tin chuyển khoản + hướng dẫn.
// Chỉ vào được khi tháng có khoản chi phí và đang "Chưa thanh toán" (kể cả quá hạn); ngược lại về /owner/finance.
// "Xác nhận" → ConfirmDialog → markTransferred (mock) → về /owner/finance (tab Chi phí, đúng tháng) kèm toast.
export default function OwnerPayment() {
  const { monthKey } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const ownerId = toUserID(user.id);
  const validKey = MONTH_KEY_PATTERN.test(monthKey ?? "");

  const [total, setTotal] = useState(null); // tổng chi phí của tháng; null = đang tải
  const [qrFailed, setQrFailed] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock expenseService / ownerService)
  useEffect(() => {
    if (!validKey) return undefined;
    let ignore = false;
    (async () => {
      const horses = await getOwnerHorses(ownerId);
      const expenses = await getExpenses(horses.map((h) => h.HorseID));
      if (ignore) return;
      setTotal(expenses.filter((e) => e.Ngay.startsWith(monthKey)).reduce((sum, e) => sum + e.SoTien, 0));
    })();
    return () => {
      ignore = true;
    };
  }, [ownerId, monthKey, validKey]);

  // "Đã chép" (tick xanh) 1,5 giây rồi trở lại biểu tượng sao chép
  useEffect(() => {
    if (!copiedKey) return undefined;
    const timer = setTimeout(() => setCopiedKey(null), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copiedKey]);

  const backState = { tab: "expense", month: monthKey };
  if (!validKey) return <Navigate to={FINANCE_PATH} replace />;
  if (total === null) return <LoadingState />;
  // Tháng không có khoản, hoặc đã Chờ xác nhận / Đã thanh toán → không cần thanh toán nữa
  if (total <= 0 || getPaymentState("expense", ownerId, monthKey).status !== "unpaid") return <Navigate to={FINANCE_PATH} replace />;

  const monthLabel = `${monthKey.slice(5, 7)}/${monthKey.slice(0, 4)}`;
  const transferContent = getTransferContent(user, monthKey);
  // Mẫu qr_only: chỉ có mã QR; mã vẫn chứa đủ số tiền và nội dung chuyển khoản
  const qrUrl =
    `https://img.vietqr.io/image/${CLUB_BANK.bankId}-${CLUB_BANK.accountNo}-qr_only.png` +
    `?amount=${encodeURIComponent(total)}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(CLUB_BANK.accountName)}`;

  const fields = [
    { key: "name", label: "Người nhận", value: CLUB_BANK.accountName, copy: CLUB_BANK.accountName },
    { key: "bank", label: "Ngân hàng", value: CLUB_BANK.bankName, copy: CLUB_BANK.bankName },
    { key: "account", label: "Số tài khoản", value: CLUB_BANK.accountNo, copy: CLUB_BANK.accountNo },
    { key: "amount", label: "Số tiền", value: formatCurrency(total), copy: String(total) },
    { key: "content", label: "Nội dung chuyển khoản", value: transferContent, copy: transferContent, mono: true },
  ];

  const handleCopy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
    } catch {
      // Trình duyệt chặn clipboard: người dùng vẫn đọc và chép tay được
    }
  };

  const handleConfirm = () => {
    markTransferred("expense", ownerId, monthKey);
    navigate(FINANCE_PATH, { state: { ...backState, toast: { text: "Đã ghi nhận. Quản lý sẽ xác nhận khi nhận được tiền." } } });
  };

  return (
    <div className="mx-auto w-full max-w-[960px] md:px-8">
      <Link
        to={FINANCE_PATH}
        state={backState}
        className={`text-sm font-semibold text-[#4a3f33] hover:text-[#c2570c] ${FOCUS_RING}`}
      >
        ← Chi phí &amp; tiền thưởng
      </Link>
      <h1 className="mt-3 font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">
        Thanh toán chi phí tháng {monthLabel}
      </h1>

      <div className="mt-8 grid items-start gap-8 min-[800px]:grid-cols-[300px_minmax(0,1fr)] min-[800px]:gap-12">
        {/* Cột trái: mã QR + số tiền */}
        <section aria-label="Mã QR" className="rounded-[4px] border border-[#d9cfba] bg-white p-6 text-center">
          <p className="text-[15px] font-semibold text-[#2b2118]">Quét mã bằng ứng dụng ngân hàng</p>
          <div className="mt-4 flex min-h-[240px] items-center justify-center">
            {qrFailed ? (
              <p className="text-sm text-[#4a3f33]">Không tải được mã QR, vui lòng chuyển khoản theo thông tin bên cạnh.</p>
            ) : (
              <img
                src={qrUrl}
                alt={`Mã QR chuyển khoản ${formatCurrency(total)}`}
                width={240}
                height={240}
                onError={() => setQrFailed(true)}
                className="block h-[240px] w-[240px] object-contain"
              />
            )}
          </div>
          <p className="mt-4 font-serif text-2xl font-semibold text-[#c2570c] tabular-nums">{formatCurrency(total)}</p>
          <p className="mt-1 text-[13px] text-[#6b6055]">Số tiền đã được điền sẵn khi quét</p>
        </section>

        {/* Cột phải: thông tin chuyển khoản + hướng dẫn */}
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-semibold text-[#2b2118]">Thông tin chuyển khoản</h2>
          <dl className="mt-3 border-t border-[#d9cfba]">
            {fields.map((field) => {
              const copied = copiedKey === field.key;
              return (
                <div key={field.key} className="flex min-h-[52px] items-center gap-3 border-b border-[#d9cfba] py-2">
                  <dt className="w-[150px] shrink-0 text-sm text-[#6b6055]">{field.label}</dt>
                  <dd className={`min-w-0 flex-1 text-[15px] font-semibold break-all text-[#2b2118] ${field.mono ? "font-mono select-all" : ""}`}>
                    {field.value}
                  </dd>
                  <button
                    type="button"
                    onClick={() => handleCopy(field.key, field.copy)}
                    title="Sao chép"
                    aria-label={`Sao chép ${field.label.toLocaleLowerCase("vi")}`}
                    className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[4px] transition-colors ${FOCUS_RING} ${
                      copied ? "text-[#4d6b2a]" : "text-[#6b6055] hover:text-[#c2570c]"
                    }`}
                  >
                    {copied ? <Check className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" /> : <Copy className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />}
                  </button>
                </div>
              );
            })}
          </dl>
          <p className="mt-3 text-sm text-[#4a3f33]">Nhập đúng nội dung chuyển khoản để quản lý đối chiếu khoản thanh toán của bạn.</p>

          <h2 className="mt-8 font-serif text-lg font-semibold text-[#2b2118]">Hướng dẫn</h2>
          <ol className="mt-3 space-y-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-[15px] text-[#2b2118]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-[#b9ab90] text-sm text-[#4a3f33] tabular-nums">
                  {index + 1}
                </span>
                <span className="pt-px">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Hàng nút cuối trang */}
      <div className="mt-8 flex flex-col gap-4 border-t border-[#d9cfba] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-[#6b6055]">Sau khi chuyển khoản, quản lý sẽ xác nhận. Trạng thái cập nhật khi có xác nhận.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to={FINANCE_PATH}
            state={backState}
            className={`inline-flex h-11 items-center justify-center rounded-[4px] border border-[#cfc4ad] bg-white px-5 text-[15px] font-semibold text-[#2b2118] transition-colors hover:bg-[#f0efec] ${FOCUS_RING}`}
          >
            Quay lại
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={`h-11 cursor-pointer rounded-[4px] bg-[#c2570c] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#a8480a] ${FOCUS_RING}`}
          >
            Xác nhận
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận chuyển khoản"
        message={`Xác nhận bạn đã chuyển khoản ${formatCurrency(total)} cho tháng ${monthLabel}?`}
        confirmLabel="Xác nhận"
        danger={false}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
