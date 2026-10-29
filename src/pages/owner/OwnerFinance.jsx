import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import { getExpenses } from "../../services/expenseService";
import { getOwnerHorses, getRaceRegistrations, getRaces } from "../../services/ownerService";
// MOCK: trạng thái thanh toán / chi trả (BE chưa có) — cô lập trong services/paymentMock.js
import { getPaymentState, seedDemoPayments } from "../../services/paymentMock";
import { STATUS_VIEW, periodStatus } from "../../utils/paymentStatus";
import { formatCurrency } from "../../utils/currency";
import { daysBetween, formatDate, formatDayMonth, todayISO } from "../../utils/date";
import DocumentViewer from "./DocumentViewer";
import MonthSelect from "./MonthSelect";
// MOCK: số chứng từ (hóa đơn / biên nhận / phiếu chi) tính ở FE — cô lập trong services/documentMock.js
import { getInvoice, getInvoiceNumber, getPayoutVoucher, getReceipt } from "../../services/documentMock";
import { getDueDate } from "../../utils/paymentDue";
import { getTransferContent } from "../../utils/paymentTransfer";
import { toUserID } from "../../utils/userId";

const ROW_LIMIT = 8;
const SOON_DAYS = 7; // còn 0–7 ngày: nhắc "sắp đến hạn"
const RANK_WORDS = { 1: "Nhất", 2: "Nhì", 3: "Ba" };
const rankWord = (rank) => RANK_WORDS[rank] ?? `Hạng ${rank}`;

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";
const TABS = [
  { value: "expense", label: "Chi phí" },
  { value: "prize", label: "Tiền thưởng" },
];

const sumOf = (items, pick) => items.reduce((sum, item) => sum + pick(item), 0);
// "2026-10" → "10/2026"
const formatMonth = (month) => `${month.slice(5, 7)}/${month.slice(0, 4)}`;
const monthsOf = (dates) => [...new Set(dates.map((date) => date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));

// "Chi phí & tiền thưởng" của Chủ ngựa — CHỈ XEM (trừ bước báo "Tôi đã chuyển khoản"). Ngựa có HORSE.OwnerID = người đang đăng nhập.
// Chi phí (chủ trả CLB) và tiền thưởng (CLB trả chủ) là hai khoản độc lập, KHÔNG bù trừ: tổng chỉ cộng trong cùng một loại.
// Bố cục một cột: 2 tab tách biệt → (cảnh báo kỳ khác quá hạn) → chọn tháng bằng dropdown kèm trạng thái từng tháng → sao kê của MỘT tháng.
// Mỗi tab nhớ tháng riêng. Lọc theo tháng làm ở client trên dữ liệu đã tải. Trạng thái thanh toán là MOCK (paymentMock.js).
export default function OwnerFinance() {
  const { user } = useAuth();
  const ownerId = toUserID(user.id);
  const navigate = useNavigate();
  const location = useLocation();

  const [horses, setHorses] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState(location.state?.tab === "prize" ? "prize" : "expense");
  const [selectedMonths, setSelectedMonths] = useState({ expense: location.state?.month ?? null, prize: null }); // mỗi tab nhớ tháng riêng
  const [showAll, setShowAll] = useState(false);
  // Quay về từ trang thanh toán (/owner/finance/pay/:monthKey) mang theo { tab, month, toast }
  const [toast, setToast] = useState(location.state?.toast ?? null);
  const [docKind, setDocKind] = useState(null); // "invoice" | "receipt" | "payout" đang xem; null = đóng

  // Đã đọc xong tab / tháng / toast từ trang thanh toán thì xóa khỏi history để Back/F5 không hiện lại
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const horseList = await getOwnerHorses(ownerId);
        const ids = horseList.map((h) => h.HorseID);
        const [expenseList, raceList, registrationList] = await Promise.all([getExpenses(ids), getRaces(), getRaceRegistrations()]);
        if (ignore) return;
        const ownRegistrations = registrationList.filter((r) => ids.includes(r.HorseID));
        // Seed trạng thái thanh toán demo lần đầu (không làm gì nếu đã có dữ liệu)
        const prizeDates = ownRegistrations
          .filter((r) => r.TienThuong !== null && r.TienThuong !== undefined)
          .map((r) => raceList.find((race) => race.RaceID === r.RaceID)?.Ngay)
          .filter(Boolean);
        seedDemoPayments(ownerId, { expense: monthsOf(expenseList.map((e) => e.Ngay)), reward: monthsOf(prizeDates) });
        setHorses(horseList);
        setExpenses(expenseList);
        setRaces(raceList);
        setRegistrations(ownRegistrations);
        setLoading(false);
      } catch (err) {
        if (!ignore) {
          setLoadError(err.message || "Không tải được chi phí và thành tích.");
          setLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [ownerId]);

  const closeToast = useCallback(() => setToast(null), []);
  const today = todayISO();
  const horseName = (horseId) => horses.find((h) => h.HorseID === horseId)?.Ten ?? `Ngựa #${horseId}`;

  // Tiền thưởng (RACEREGISTRATION.TienThuong) và chi phí, đều mới nhất trước
  const prizes = registrations
    .filter((r) => r.TienThuong !== null && r.TienThuong !== undefined)
    .map((r) => ({ registration: r, race: races.find((race) => race.RaceID === r.RaceID) }))
    .filter(({ race }) => race)
    .sort((a, b) => b.race.Ngay.localeCompare(a.race.Ngay));
  const sortedExpenses = [...expenses].sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.ExpenseID - a.ExpenseID);

  const isExpenseTab = tab === "expense";
  const kind = isExpenseTab ? "expense" : "reward"; // loại kỳ trong paymentMock
  const items = isExpenseTab ? sortedExpenses : prizes;
  const dateOf = (item) => (isExpenseTab ? item.Ngay : item.race.Ngay);
  const amountOf = (item) => (isExpenseTab ? item.SoTien : item.registration.TienThuong);

  // Các kỳ (tháng có dữ liệu của TAB đang xem, mới nhất trước) và kỳ đang chọn (mặc định mới nhất)
  const months = monthsOf(items.map(dateOf));
  const month = months.includes(selectedMonths[tab]) ? selectedMonths[tab] : (months[0] ?? null);
  const rows = month ? items.filter((item) => dateOf(item).startsWith(month)) : [];
  const visibleRows = showAll ? rows : rows.slice(0, ROW_LIMIT);
  const total = sumOf(rows, amountOf);

  const changeTab = (value) => {
    setTab(value);
    setShowAll(false);
  };
  const selectMonth = (target) => {
    setSelectedMonths((prev) => ({ ...prev, [tab]: target }));
    setShowAll(false);
  };

  // Nội dung hộp trạng thái của kỳ đang chọn
  const statusKey = month ? periodStatus(kind, ownerId, month, today) : null;
  const state = month ? getPaymentState(kind, ownerId, month) : null;
  const dueDate = isExpenseTab && month ? getDueDate(month) : null;
  const daysToDue = dueDate ? daysBetween(today, dueDate) : null;
  const left = daysToDue === 0 ? "hôm nay là hạn" : `còn ${daysToDue} ngày`;

  const describeStatus = () => {
    if (statusKey === "paid") return { border: "#4d6b2a", text: `Đã thanh toán ngày ${formatDate(state.paidAt)}, quản lý đã xác nhận.` };
    if (statusKey === "transferred") {
      return { border: "#c2570c", text: `Bạn đã báo chuyển khoản ngày ${formatDate(state.transferredAt)}. Đang chờ quản lý xác nhận đã nhận tiền.` };
    }
    if (statusKey === "overdue") {
      return {
        border: "#c0262d",
        text: `Quá hạn ${-daysToDue} ngày (hạn ${formatDate(dueDate)}). Vui lòng thanh toán hoặc liên hệ quản lý câu lạc bộ.`,
      };
    }
    if (statusKey === "unpaid") {
      return daysToDue <= SOON_DAYS
        ? { border: "#c2570c", text: `Sắp đến hạn thanh toán: ${formatDate(dueDate)}, ${left}.` }
        : { border: "#d9cfba", text: `Chưa thanh toán. Hạn ${formatDate(dueDate)}, ${left}.` };
    }
    if (statusKey === "received") return { border: "#4d6b2a", text: `Đã nhận ngày ${formatDate(state.receivedAt)}.` };
    return { border: "#c2570c", text: "Câu lạc bộ sẽ chi trả trong vòng 14 ngày sau khi kết quả được xác nhận." };
  };
  const statusBox = month ? describeStatus() : null;
  const StatusIcon = statusKey ? STATUS_VIEW[statusKey].Icon : null;
  const showQrButton = isExpenseTab && month && (statusKey === "unpaid" || statusKey === "overdue") && total > 0;

  // Nút mở chứng từ trong hộp trạng thái: chi phí → hóa đơn (+ biên nhận khi đã thanh toán); thưởng → phiếu chi khi đã nhận
  const docButtons = !month
    ? []
    : isExpenseTab
      ? [{ kind: "invoice", label: "Xem hóa đơn" }, ...(statusKey === "paid" ? [{ kind: "receipt", label: "Xem biên nhận" }] : [])]
      : statusKey === "received"
        ? [{ kind: "payout", label: "Xem phiếu chi" }]
        : [];

  // Dữ liệu cho khung xem chứng từ (dùng đủ mọi khoản của tháng, không bị giới hạn bởi "Xem thêm")
  const buildDocumentProps = () => {
    const common = {
      ownerName: user.fullName ?? String(user.id),
      monthLabel: `Tháng ${formatMonth(month)}`,
      total,
      rows: isExpenseTab
        ? rows.map((e) => ({ key: e.ExpenseID, date: e.Ngay, content: e.GhiChu || e.LoaiChiPhi, horse: horseName(e.HorseID), amount: e.SoTien }))
        : rows.map(({ registration, race }) => ({
            key: `${race.RaceID}-${registration.HorseID}`,
            date: race.Ngay,
            content: registration.ThuHang >= 1 ? `${race.TenGiai} · hạng ${rankWord(registration.ThuHang)}` : race.TenGiai,
            horse: horseName(registration.HorseID),
            amount: registration.TienThuong,
          })),
    };
    if (docKind === "receipt") return { ...common, kind: "receipt", ...getReceipt(month, user, state.paidAt), paidDate: state.paidAt, invoiceNumber: getInvoiceNumber(month, user) };
    if (docKind === "payout") return { ...common, kind: "payout", ...getPayoutVoucher(month, user, state.receivedAt), paidDate: state.receivedAt };
    return {
      ...common,
      kind: "invoice",
      ...getInvoice(month, user),
      dueDate,
      status: STATUS_VIEW[statusKey],
      transferContent: getTransferContent(user, month),
    };
  };

  // Các tháng KHÁC tháng đang chọn đang quá hạn thanh toán (chỉ tab Chi phí), mới nhất trước
  const overdueOthers = isExpenseTab ? months.filter((m) => m !== month && periodStatus("expense", ownerId, m, today) === "overdue") : [];

  return (
    <div className="mx-auto w-full max-w-[880px] md:px-8">
      <div>
        <h1 className="font-serif text-[32px] leading-tight font-semibold tracking-tight text-[#2b2118]">Chi phí &amp; tiền thưởng</h1>
        <p className="mt-1 text-[15px] text-[#4a3f33]">
          Chi phí tính theo tháng, thanh toán ngoài hệ thống. Tiền thưởng do câu lạc bộ chi trả riêng.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : horses.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-[#d9cfba] bg-white py-16 text-center">
          <p className="font-serif text-lg font-semibold text-[#2b2118]">Chưa có ngựa nào gắn với tài khoản của bạn</p>
          <p className="mt-1.5 text-sm text-[#4a3f33]">Liên hệ Quản lý CLB để được thêm ngựa vào hồ sơ.</p>
        </div>
      ) : (
        <>
          {/* Hai lựa chọn chính: tab gạch chân, tách biệt hoàn toàn */}
          <div role="tablist" aria-label="Chi phí hoặc tiền thưởng" className="mt-10 flex gap-x-8 border-b border-[#d9cfba]">
            {TABS.map((t) => {
              const active = t.value === tab;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeTab(t.value)}
                  className={`-mb-px cursor-pointer border-b-2 px-1 py-3 text-base transition-colors ${FOCUS_RING} ${
                    active ? "border-[#c2570c] font-semibold text-[#2b2118]" : "border-transparent text-[#6b6055] hover:text-[#2b2118]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Cảnh báo kỳ khác (chỉ tab Chi phí): có tháng KHÁC tháng đang chọn đang quá hạn thanh toán */}
          {overdueOthers.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[4px] border border-[#c0262d] bg-white px-4 py-3">
              <TriangleAlert className="h-[18px] w-[18px] shrink-0 text-[#c0262d]" strokeWidth={2} aria-hidden="true" />
              <p className="min-w-0 flex-1 text-[15px] text-[#2b2118]">
                {overdueOthers.length === 1
                  ? `Tháng ${formatMonth(overdueOthers[0])} đã quá hạn thanh toán ${-daysBetween(today, getDueDate(overdueOthers[0]))} ngày.`
                  : `Có ${overdueOthers.length} kỳ quá hạn thanh toán: ${overdueOthers.map((m) => `Tháng ${formatMonth(m)}`).join(", ")}.`}
              </p>
              <button
                type="button"
                onClick={() => selectMonth(overdueOthers[overdueOthers.length - 1])}
                className={`cursor-pointer text-sm font-semibold text-[#c2570c] underline-offset-2 hover:underline ${FOCUS_RING}`}
              >
                Xem kỳ này
              </button>
            </div>
          )}

          {/* Chọn tháng (trái) + tổng của tháng đang chọn (phải) */}
          {months.length > 0 && (
            <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <span id="financeMonthLabel" className="mb-1 block text-[13px] font-semibold text-[#4a3f33]">
                  Tháng
                </span>
                <MonthSelect
                  options={months.map((m) => {
                    const view = STATUS_VIEW[periodStatus(kind, ownerId, m, today)];
                    return { value: m, label: `Tháng ${formatMonth(m)}`, statusLabel: view.label, statusColor: view.color };
                  })}
                  value={month}
                  onChange={selectMonth}
                  ariaLabel="Chọn tháng"
                />
                <p className="mt-1.5 text-sm text-[#6b6055]">{rows.length} khoản</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] text-[#6b6055]">Tổng</p>
                <p className="font-serif text-[28px] leading-tight font-semibold whitespace-nowrap text-[#2b2118] tabular-nums">{formatCurrency(total)}</p>
              </div>
            </div>
          )}

          {!month || rows.length === 0 ? (
            <p className="mt-8 py-10 text-center text-[15px] text-[#6b6055]">Không có khoản nào trong tháng này.</p>
          ) : (
            <>
              {/* Hộp trạng thái: viền màu theo trạng thái, nền trắng, full width */}
              <div
                className="mt-5 flex flex-wrap items-start gap-3 rounded-[4px] border bg-white px-5 py-4 text-[15px] text-[#2b2118]"
                style={{ borderColor: statusBox.border }}
              >
                {StatusIcon && (
                  <StatusIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: STATUS_VIEW[statusKey].color }} strokeWidth={2} aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p>{statusBox.text}</p>
                  {!isExpenseTab && <p className="mt-1 text-sm text-[#6b6055]">Tiền thưởng không trừ vào chi phí.</p>}
                </div>
                {docButtons.length > 0 && (
                  <div className="ml-auto flex shrink-0 flex-wrap gap-2 self-center">
                    {docButtons.map((button) => (
                      <button
                        key={button.kind}
                        type="button"
                        onClick={() => setDocKind(button.kind)}
                        className={`h-9 cursor-pointer rounded-[4px] border border-[#cfc4ad] bg-white px-4 text-sm font-semibold text-[#2b2118] transition-colors hover:bg-[#f0efec] ${FOCUS_RING}`}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sao kê: danh sách dòng, không bảng */}
              <ul className="mt-6 border-y border-[#2b2118] [&>li:last-child]:border-b-0">
                {isExpenseTab
                  ? visibleRows.map((expense) => (
                      <LedgerRow
                        key={expense.ExpenseID}
                        date={expense.Ngay}
                        title={expense.GhiChu || expense.LoaiChiPhi}
                        detail={`${horseName(expense.HorseID)} · ${expense.LoaiChiPhi}`}
                        amount={expense.SoTien}
                      />
                    ))
                  : visibleRows.map(({ registration, race }) => (
                      <LedgerRow
                        key={`${race.RaceID}-${registration.HorseID}`}
                        date={race.Ngay}
                        title={race.TenGiai}
                        detail={
                          <>
                            {horseName(registration.HorseID)}
                            {registration.ThuHang >= 1 && (
                              <>
                                {" "}
                                · hạng{" "}
                                <span className={registration.ThuHang === 1 ? "font-semibold text-[#c2570c]" : "text-[#2b2118]"}>
                                  {rankWord(registration.ThuHang)}
                                </span>
                              </>
                            )}
                          </>
                        }
                        amount={registration.TienThuong}
                      />
                    ))}
              </ul>

              {rows.length > ROW_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className={`mt-4 cursor-pointer text-sm font-semibold text-[#c2570c] underline-offset-2 hover:underline ${FOCUS_RING}`}
                >
                  {showAll ? "Thu gọn" : `Xem thêm (${rows.length - ROW_LIMIT} khoản)`}
                </button>
              )}

              {/* Hàng cuối (tab Chi phí): Chưa thanh toán / Quá hạn → nút QR; Chờ xác nhận → chữ chờ; Đã thanh toán → không có hàng này */}
              {isExpenseTab && statusKey !== "paid" && (
                <div className="mt-5 flex sm:justify-end">
                  {showQrButton ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/owner/finance/pay/${month}`)}
                      className={`h-11 w-full cursor-pointer rounded-[4px] bg-[#c2570c] px-6 text-[15px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#a8480a] sm:w-auto ${FOCUS_RING}`}
                    >
                      Thanh toán bằng mã QR
                    </button>
                  ) : (
                    statusKey === "transferred" && <p className="text-sm text-[#c2570c]">Đang chờ quản lý xác nhận</p>
                  )}
                </div>
              )}
            </>
          )}

          {docKind && month && <DocumentViewer {...buildDocumentProps()} onClose={() => setDocKind(null)} />}
          <Toast toast={toast} onClose={closeToast} />
        </>
      )}
    </div>
  );
}

// 1 dòng sao kê: ngày dd/mm | nội dung 2 dòng | số tiền (một dòng, không xuống dòng)
function LedgerRow({ date, title, detail, amount }) {
  return (
    <li className="flex min-h-[60px] items-center gap-4 border-b border-[#d9cfba] px-1 transition-colors hover:bg-[#f0efec]">
      <span className="w-16 shrink-0 text-[15px] text-[#6b6055] tabular-nums">{formatDayMonth(date)}</span>
      <div className="min-w-0 flex-1 py-2">
        <p className="truncate text-base text-[#2b2118]">{title}</p>
        <p className="truncate text-sm text-[#6b6055]">{detail}</p>
      </div>
      <span className="shrink-0 text-base font-semibold whitespace-nowrap text-[#2b2118] tabular-nums">{formatCurrency(amount)}</span>
    </li>
  );
}
