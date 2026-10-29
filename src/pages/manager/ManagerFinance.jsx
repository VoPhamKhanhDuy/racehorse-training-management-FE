import { useCallback, useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import ExpenseFormDialog from "./ExpenseFormDialog";
import PaymentConfirmDialog from "./PaymentConfirmDialog";
import PrizeDialog from "./PrizeDialog";
import MonthSelect from "../owner/MonthSelect";
import { createExpense, deleteExpense, getExpenses, updateExpense } from "../../services/expenseService";
import { getHorseOwners, getHorses } from "../../services/horseService";
import {
  dismissPrizeAlert,
  getPrizeAlerts,
  getRaceRegistrations,
  getRaces,
  setRaceRegistrationPrize,
} from "../../services/trainerService";
// MOCK: trạng thái thanh toán / chi trả theo từng chủ ngựa (BE chưa có) — cô lập trong services/paymentMock.js
import { confirmPayment, getPaymentState, seedDemoPayments } from "../../services/paymentMock";
import { addAuditLog } from "../../services/auditService";
import { formatCurrency } from "../../utils/currency";
import { formatDate, todayISO } from "../../utils/date";
import { getDueDate } from "../../utils/paymentDue";
import { STATUS_VIEW as BASE_STATUS_VIEW, periodStatus } from "../../utils/paymentStatus";
import { formatRankWord, NO_RANK } from "../../utils/raceResult";
import { toUserID } from "../../utils/userId";

const EXPENSE_LIMIT = 10;
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";
const TABS = [
  { value: "expense", label: "Chi phí" },
  { value: "reward", label: "Tiền thưởng" },
];
// Phía Quản lý gọi khoản thưởng đã nhận là "Đã chi trả"
const STATUS_VIEW = { ...BASE_STATUS_VIEW, received: { ...BASE_STATUS_VIEW.received, label: "Đã chi trả" } };
// Thứ tự kỳ thanh toán: chờ xác nhận lên đầu, rồi quá hạn, chưa thanh toán, đã thanh toán
const PAYMENT_ORDER = { transferred: 0, overdue: 1, unpaid: 2, paid: 3 };

const sumOf = (items, pick) => items.reduce((sum, item) => sum + pick(item), 0);
const monthsOf = (dates) => [...new Set(dates.map((date) => date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
// "2026-10" → "10/2026"
const formatMonth = (month) => `${month.slice(5, 7)}/${month.slice(0, 4)}`;

// Nút phụ viền cam cao 32px (thao tác trong bảng)
const OUTLINE_BUTTON = `h-8 cursor-pointer rounded-[4px] border border-[#c2570c] bg-white px-3 text-sm font-semibold whitespace-nowrap text-[#c2570c] transition-colors hover:bg-[#fbf3e6] ${FOCUS_RING}`;

// Bảng chuẩn: header nâu 40px; ô nội dung 52px (CELL) hoặc 48px (CELL_SM, bảng chi phí)
const HEAD = "h-10 border-b border-[#b9ab90] bg-[#4a3a2a] px-4 py-0 text-[13px] font-semibold whitespace-nowrap text-[#f3ede0]";
const CELL = "h-[52px] border-b border-[#d9cfba] px-4 py-0 text-[15px] align-middle";
const CELL_SM = "h-12 border-b border-[#d9cfba] px-4 py-0 text-[15px] align-middle";
// Thao tác "Sửa" / "Xóa" dạng chữ 14px semibold, luôn hiện
const TEXT_ACTION = `cursor-pointer text-sm font-semibold hover:underline ${FOCUS_RING}`;

// Trạng thái 1 kỳ: chữ 14px semibold có màu, không icon / không nền
function StatusText({ statusKey }) {
  const view = STATUS_VIEW[statusKey];
  return (
    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: view.color }}>
      {view.label}
    </span>
  );
}

// "Chi phí & tiền thưởng" của Quản lý CLB: 2 tab (Chi phí | Tiền thưởng), lọc theo tháng / chủ ngựa / ngựa (làm ở client).
// Dùng CHUNG kho dữ liệu với /owner/finance (expenseService + RACEREGISTRATION.TienThuong) — chủ ngựa thấy sau khi tải lại trang.
// Chi phí và tiền thưởng là hai khoản độc lập, KHÔNG bù trừ. Trạng thái thanh toán / chi trả là MOCK (paymentMock.js, theo chủ ngựa).
// Mỗi thao tác ghi đều ghi nhật ký (AUDITLOG).
export default function ManagerFinance() {
  const { user } = useAuth();
  const managerId = toUserID(user.id);
  const today = todayISO();

  const [horses, setHorses] = useState([]);
  const [owners, setOwners] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("expense");
  const [selectedMonths, setSelectedMonths] = useState({ expense: null, reward: null }); // mỗi tab nhớ tháng riêng
  const [ownerFilter, setOwnerFilter] = useState("");
  const [horseFilterValue, setHorseFilterValue] = useState("");
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(null); // { expense } — expense = null: thêm mới
  const [prizeTarget, setPrizeTarget] = useState(null); // { race, horse, registration }
  const [deleteTarget, setDeleteTarget] = useState(null); // expense
  const [deleting, setDeleting] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null); // { kind, ownerId, ownerName, month, amount }
  const [, setPaymentVersion] = useState(0); // tăng khi trạng thái thanh toán (mock) đổi để vẽ lại
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock service)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getHorseOwners(), getExpenses(), getRaces(), getRaceRegistrations(), getPrizeAlerts()]).then(
      ([horseList, ownerList, expenseList, raceList, registrationList, alertList]) => {
        if (ignore) return;
        // Seed trạng thái thanh toán demo cho từng chủ ngựa có dữ liệu (cùng quy tắc với /owner/finance; mỗi chủ chỉ seed 1 lần)
        ownerList.forEach((owner) => {
          const ownHorseIds = new Set(horseList.filter((h) => h.OwnerID === owner.UserID).map((h) => h.HorseID));
          const expenseMonths = monthsOf(expenseList.filter((e) => ownHorseIds.has(e.HorseID)).map((e) => e.Ngay));
          const rewardMonths = monthsOf(
            registrationList
              .filter((r) => ownHorseIds.has(r.HorseID) && r.TienThuong !== null && r.TienThuong !== undefined)
              .map((r) => raceList.find((race) => race.RaceID === r.RaceID)?.Ngay)
              .filter(Boolean)
          );
          if (expenseMonths.length > 0 || rewardMonths.length > 0) seedDemoPayments(owner.UserID, { expense: expenseMonths, reward: rewardMonths });
        });
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setOwners(ownerList);
        setExpenses(expenseList);
        setRaces(raceList);
        setRegistrations(registrationList);
        setAlerts(alertList);
        setLoading(false);
        if (alertList.length > 0) {
          setToast({ text: `Có ${alertList.length} kết quả thi đấu đã đổi, cần nhập lại tiền thưởng`, error: true });
        }
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const ownerById = Object.fromEntries(owners.map((o) => [o.UserID, o]));
  const raceById = Object.fromEntries(races.map((r) => [r.RaceID, r]));
  const horseName = (horseId) => horseById[horseId]?.Ten ?? `Ngựa #${horseId}`;
  const ownerIdOfHorse = (horseId) => horseById[horseId]?.OwnerID;
  const ownerName = (ownerId) => ownerById[ownerId]?.HoTen ?? "Chưa rõ";

  // Tiền thưởng của các lượt đăng ký giải ĐÃ diễn ra
  const prizeRows = registrations
    .map((registration) => ({ registration, race: raceById[registration.RaceID], horse: horseById[registration.HorseID] }))
    .filter(({ race, horse }) => race && horse && race.Ngay < today)
    .sort((a, b) => b.race.Ngay.localeCompare(a.race.Ngay) || a.horse.Ten.localeCompare(b.horse.Ten, "vi"));

  const isExpenseTab = tab === "expense";
  const kind = isExpenseTab ? "expense" : "reward";
  const dateOfRow = (row) => (isExpenseTab ? row.Ngay : row.race.Ngay);
  const horseIdOfRow = (row) => (isExpenseTab ? row.HorseID : row.horse.HorseID);
  const allRows = isExpenseTab ? expenses : prizeRows;

  // Tháng (mới nhất trước, mặc định mới nhất), chủ ngựa, ngựa — bộ lọc ngựa chỉ liệt kê ngựa của chủ đang chọn
  const months = monthsOf(allRows.map(dateOfRow));
  const month = months.includes(selectedMonths[kind]) ? selectedMonths[kind] : (months[0] ?? null);
  const horseOptions = horses.filter((h) => !ownerFilter || String(h.OwnerID) === ownerFilter);
  const horseFilter = horseOptions.some((h) => String(h.HorseID) === horseFilterValue) ? horseFilterValue : "";

  const monthRows = month ? allRows.filter((row) => dateOfRow(row).startsWith(month)) : [];
  const matchesFilters = (row) =>
    (!ownerFilter || String(ownerIdOfHorse(horseIdOfRow(row))) === ownerFilter) && (!horseFilter || String(horseIdOfRow(row)) === horseFilter);
  const filteredRows = monthRows.filter(matchesFilters);
  const monthNumber = month ? Number(month.slice(5, 7)) : null;

  // ---- Tab Chi phí: bảng thanh toán theo chủ ngựa (chỉ lọc theo chủ ngựa) ----
  const paymentRows = isExpenseTab && month
    ? Object.values(
        monthRows.reduce((acc, expense) => {
          const ownerId = ownerIdOfHorse(expense.HorseID);
          if (ownerFilter && String(ownerId) !== ownerFilter) return acc;
          acc[ownerId] ??= { ownerId, count: 0, total: 0 };
          acc[ownerId].count += 1;
          acc[ownerId].total += expense.SoTien;
          return acc;
        }, {})
      )
        .map((row) => ({ ...row, statusKey: periodStatus("expense", row.ownerId, month, today), state: getPaymentState("expense", row.ownerId, month) }))
        .sort((a, b) => PAYMENT_ORDER[a.statusKey] - PAYMENT_ORDER[b.statusKey] || ownerName(a.ownerId).localeCompare(ownerName(b.ownerId), "vi"))
    : [];

  // Cột "Chủ ngựa" chỉ hiện khi đang xem tất cả chủ ngựa và dữ liệu đang xem có hơn một chủ
  const showOwnerColumn = !ownerFilter && new Set(filteredRows.map((row) => ownerIdOfHorse(horseIdOfRow(row)))).size > 1;
  const visibleExpenses = showAllExpenses ? filteredRows : filteredRows.slice(0, EXPENSE_LIMIT);
  const expenseTotal = isExpenseTab ? sumOf(filteredRows, (e) => e.SoTien) : 0;
  const prizeTotal = !isExpenseTab ? sumOf(filteredRows.filter((r) => r.registration.TienThuong > 0), (r) => r.registration.TienThuong) : 0;

  const audit = (HanhDong, TargetTable, TargetID, targetLabel) =>
    addAuditLog({ UserID: managerId, HanhDong, TargetTable, TargetID, targetLabel });
  const expenseSummaryText = (expense) => `${expense.LoaiChiPhi.toLocaleLowerCase("vi")} ${formatCurrency(expense.SoTien)}`;

  const changeTab = (value) => {
    setTab(value);
    setShowAllExpenses(false);
  };
  const changeMonth = (value) => {
    setSelectedMonths((prev) => ({ ...prev, [kind]: value }));
    setShowAllExpenses(false);
  };

  const handleSaveExpense = async (form) => {
    const editing = expenseDialog.expense;
    const saved = editing ? await updateExpense(editing.ExpenseID, form) : await createExpense(form);
    audit(`${editing ? "Sửa" : "Thêm"} chi phí ${expenseSummaryText(saved)}`, "EXPENSE", saved.ExpenseID, horseName(saved.HorseID));
    setExpenses((prev) => {
      const next = editing ? prev.map((e) => (e.ExpenseID === saved.ExpenseID ? saved : e)) : [...prev, saved];
      return next.sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.ExpenseID - a.ExpenseID);
    });
    setToast({ text: editing ? "Đã cập nhật chi phí" : "Đã thêm chi phí" });
    setExpenseDialog(null);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const removed = await deleteExpense(deleteTarget.ExpenseID);
      audit(`Xóa chi phí ${expenseSummaryText(removed)}`, "EXPENSE", removed.ExpenseID, horseName(removed.HorseID));
      setExpenses((prev) => prev.filter((e) => e.ExpenseID !== removed.ExpenseID));
      setToast({ text: "Đã xóa chi phí" });
    } catch (err) {
      setToast({ text: err.message, error: true });
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleSavePrize = async (amount) => {
    const { race, horse, registration } = prizeTarget;
    const hadPrize = registration.TienThuong !== null && registration.TienThuong !== undefined;
    const saved = await setRaceRegistrationPrize(race.RaceID, horse.HorseID, amount);
    audit(
      `${hadPrize ? "Sửa" : "Nhập"} tiền thưởng ${race.TenGiai} – ${horse.Ten} ${formatCurrency(amount)}`,
      "RACEREGISTRATION",
      race.RaceID,
      horse.Ten
    );
    setRegistrations((prev) => prev.map((r) => (r.RaceID === saved.RaceID && r.HorseID === saved.HorseID ? saved : r)));
    setAlerts((prev) => prev.filter((a) => !(a.RaceID === race.RaceID && a.HorseID === horse.HorseID)));
    setToast({ text: "Đã cập nhật tiền thưởng" });
    setPrizeTarget(null);
  };

  const handleDismissAlert = async (alert) => {
    await dismissPrizeAlert(alert.AlertID);
    setAlerts((prev) => prev.filter((a) => a.AlertID !== alert.AlertID));
  };

  // Xác nhận đã nhận tiền (chi phí) / đã chi trả (tiền thưởng) của 1 kỳ của 1 chủ ngựa → paymentMock; phía Chủ ngựa thấy đổi theo
  const handleConfirmPayment = ({ date, note }) => {
    const { kind: targetKind, ownerId, ownerName: name, month: targetMonth } = paymentTarget;
    confirmPayment(targetKind, ownerId, targetMonth, { date, note });
    audit(
      targetKind === "expense"
        ? `Xác nhận đã nhận thanh toán tháng ${formatMonth(targetMonth)}`
        : `Xác nhận đã chi trả tiền thưởng tháng ${formatMonth(targetMonth)}`,
      targetKind === "expense" ? "EXPENSE" : "RACEREGISTRATION",
      ownerId,
      name
    );
    setPaymentVersion((v) => v + 1);
    setToast({ text: targetKind === "expense" ? "Đã xác nhận thanh toán" : "Đã xác nhận chi trả" });
    setPaymentTarget(null);
  };

  // Tổng tiền thưởng của 1 chủ ngựa trong 1 tháng (trạng thái chi trả là theo chủ + tháng)
  const rewardTotalOf = (ownerId, rewardMonth) =>
    sumOf(
      prizeRows.filter(
        ({ registration, race, horse }) => horse.OwnerID === ownerId && race.Ngay.startsWith(rewardMonth) && registration.TienThuong > 0
      ),
      ({ registration }) => registration.TienThuong
    );

  const dropdownLabel = "mb-1 block text-[13px] font-semibold text-[#4a3f33]";

  return (
    <div className="mx-auto w-full max-w-[1180px] md:px-8">
      <div>
        <h1 className="font-serif text-[32px] leading-tight font-semibold tracking-tight text-[#2b2118]">Chi phí &amp; tiền thưởng</h1>
        <p className="mt-1 text-[15px] text-[#4a3f33]">Ghi nhận chi phí và tiền thưởng của từng ngựa. Chủ ngựa xem được các khoản này.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Kết quả thi đấu đã đổi làm mất tiền thưởng cũ → Quản lý cần nhập lại */}
          {alerts.length > 0 && (
            <ul aria-label="Thông báo" className="mt-6 space-y-2">
              {alerts.map((alert) => (
                <li
                  key={alert.AlertID}
                  role="status"
                  className="flex items-start justify-between gap-4 rounded-[4px] border border-[#c2570c] bg-white px-4 py-3 text-[15px] text-[#2b2118]"
                >
                  <span className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#c2570c]" strokeWidth={2} aria-hidden="true" />
                    <span>
                      Kết quả của <span className="font-semibold">{horseName(alert.HorseID)}</span> tại{" "}
                      <span className="font-semibold">{raceById[alert.RaceID]?.TenGiai ?? `giải #${alert.RaceID}`}</span> đã đổi, cần nhập lại
                      tiền thưởng
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDismissAlert(alert)}
                    className={`shrink-0 cursor-pointer text-sm font-semibold text-[#4a3f33] hover:text-[#c2570c] hover:underline ${FOCUS_RING}`}
                  >
                    Đã xem
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Hai tab chính */}
          <div role="tablist" aria-label="Chi phí hoặc tiền thưởng" className="mt-8 flex gap-x-8 border-b border-[#d9cfba]">
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

          {/* Thanh công cụ: tháng, chủ ngựa, ngựa; nút thêm chi phí bên phải (tab Chi phí) */}
          <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-3">
            {months.length > 0 && (
              <div className="w-full sm:w-auto">
                <span className={dropdownLabel}>Tháng</span>
                <MonthSelect
                  options={months.map((m) => ({ value: m, label: `Tháng ${formatMonth(m)}` }))}
                  value={month}
                  onChange={changeMonth}
                  ariaLabel="Chọn tháng"
                />
              </div>
            )}
            <div className="w-full sm:w-auto">
              <span className={dropdownLabel}>Chủ ngựa</span>
              <MonthSelect
                options={[{ value: "", label: "Tất cả chủ ngựa" }, ...owners.map((o) => ({ value: String(o.UserID), label: o.HoTen }))]}
                value={ownerFilter}
                onChange={(value) => {
                  setOwnerFilter(value);
                  setShowAllExpenses(false);
                }}
                ariaLabel="Lọc theo chủ ngựa"
              />
            </div>
            <div className="w-full sm:w-auto">
              <span className={dropdownLabel}>Ngựa</span>
              <MonthSelect
                options={[{ value: "", label: "Tất cả ngựa" }, ...horseOptions.map((h) => ({ value: String(h.HorseID), label: h.Ten }))]}
                value={horseFilter}
                onChange={(value) => {
                  setHorseFilterValue(value);
                  setShowAllExpenses(false);
                }}
                ariaLabel="Lọc theo ngựa"
              />
            </div>
            {isExpenseTab && (
              <button
                type="button"
                onClick={() => setExpenseDialog({ expense: null })}
                className={`h-10 w-full cursor-pointer rounded-[4px] bg-[#c2570c] px-5 text-[15px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#a8480a] sm:ml-auto sm:w-auto ${FOCUS_RING}`}
              >
                Thêm chi phí
              </button>
            )}
          </div>

          {isExpenseTab ? (
            <>
              {/* Khối 1: thanh toán của tháng theo chủ ngựa */}
              <section aria-label="Thanh toán theo chủ ngựa" className="mt-10">
                <h2 className="font-serif text-xl font-semibold text-[#2b2118]">{month ? `Thanh toán tháng ${formatMonth(month)}` : "Thanh toán"}</h2>
                <div className="mt-3 overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white">
                  {paymentRows.length === 0 ? (
                    <p className="px-6 py-10 text-center text-[15px] text-[#6b6055]">Không có khoản nào trong tháng này.</p>
                  ) : (
                    <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-[15px]">
                      <thead>
                        <tr>
                          <th className={HEAD}>Chủ ngựa</th>
                          <th className={`${HEAD} text-right`}>Số khoản</th>
                          <th className={`${HEAD} text-right`}>Tổng chi phí</th>
                          <th className={HEAD}>Hạn thanh toán</th>
                          <th className={HEAD}>Trạng thái</th>
                          <th className={`${HEAD} text-right`}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#2b2118] [&>tr:last-child>td]:border-b-0">
                        {paymentRows.map(({ ownerId, count, total, statusKey, state }) => (
                          <tr key={ownerId} className="transition-colors hover:bg-[#f0efec]">
                            <td className={`${CELL} font-semibold whitespace-nowrap`}>{ownerName(ownerId)}</td>
                            <td className={`${CELL} text-right tabular-nums`}>{count}</td>
                            <td className={`${CELL} text-right font-semibold whitespace-nowrap tabular-nums`}>{formatCurrency(total)}</td>
                            <td className={`${CELL} whitespace-nowrap text-[#4a3f33] tabular-nums`}>{formatDate(getDueDate(month))}</td>
                            <td className={CELL}>
                              <StatusText statusKey={statusKey} />
                            </td>
                            <td className={`${CELL} text-right whitespace-nowrap`}>
                              {statusKey === "paid" ? (
                                <span className="text-[13px] text-[#6b6055]">Nhận {formatDate(state.paidAt)}</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPaymentTarget({ kind: "expense", ownerId, ownerName: ownerName(ownerId), month, amount: total })}
                                  className={OUTLINE_BUTTON}
                                >
                                  {statusKey === "transferred" ? "Xác nhận đã nhận" : "Đánh dấu đã nhận"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* Khối 2: các khoản chi phí */}
              <section aria-label="Các khoản chi phí" className="mt-10">
                <h2 className="font-serif text-xl font-semibold text-[#2b2118]">Các khoản chi phí</h2>
                {filteredRows.length > 0 && (
                  <p className="mt-1 text-sm font-semibold text-[#2b2118]">
                    Tổng chi phí tháng {monthNumber}: {formatCurrency(expenseTotal)}
                  </p>
                )}
                <div className="mt-3 overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white">
                  {filteredRows.length === 0 ? (
                    <p className="px-6 py-10 text-center text-[15px] text-[#6b6055]">Chưa có khoản nào</p>
                  ) : (
                    <>
                      <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-[15px]">
                        <thead>
                          <tr>
                            <th className={HEAD}>Ngày</th>
                            {showOwnerColumn && <th className={HEAD}>Chủ ngựa</th>}
                            <th className={HEAD}>Ngựa</th>
                            <th className={HEAD}>Loại</th>
                            <th className={HEAD}>Ghi chú</th>
                            <th className={`${HEAD} text-right`}>Số tiền</th>
                            <th className={`${HEAD} text-right`}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#2b2118] [&>tr:last-child>td]:border-b-0">
                          {visibleExpenses.map((expense) => (
                            <tr key={expense.ExpenseID} className="transition-colors hover:bg-[#f0efec]">
                              <td className={`${CELL_SM} text-sm whitespace-nowrap text-[#4a3f33] tabular-nums`}>{formatDate(expense.Ngay)}</td>
                              {showOwnerColumn && (
                                <td className={`${CELL_SM} max-w-[180px] truncate text-sm text-[#4a3f33]`} title={ownerName(ownerIdOfHorse(expense.HorseID))}>
                                  {ownerName(ownerIdOfHorse(expense.HorseID))}
                                </td>
                              )}
                              <td className={`${CELL_SM} font-serif font-semibold whitespace-nowrap`}>{horseName(expense.HorseID)}</td>
                              <td className={`${CELL_SM} text-sm whitespace-nowrap text-[#4a3f33]`}>{expense.LoaiChiPhi.toLocaleLowerCase("vi")}</td>
                              <td className={`${CELL_SM} max-w-[240px] truncate text-sm text-[#4a3f33]`} title={expense.GhiChu}>
                                {expense.GhiChu || "—"}
                              </td>
                              <td className={`${CELL_SM} text-right font-semibold whitespace-nowrap tabular-nums`}>{formatCurrency(expense.SoTien)}</td>
                              <td className={`${CELL_SM} text-right whitespace-nowrap`}>
                                <span className="inline-flex items-center gap-4">
                                  <button type="button" onClick={() => setExpenseDialog({ expense })} aria-label="Sửa" className={`${TEXT_ACTION} text-[#c2570c]`}>
                                    Sửa
                                  </button>
                                  <button type="button" onClick={() => setDeleteTarget(expense)} aria-label="Xóa" className={`${TEXT_ACTION} text-[#c0262d]`}>
                                    Xóa
                                  </button>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex items-center justify-between gap-4 border-t border-[#d9cfba] px-4 py-3 text-sm text-[#4a3f33]">
                        <span className="tabular-nums">
                          Hiển thị {visibleExpenses.length} / {filteredRows.length} khoản
                        </span>
                        {filteredRows.length > EXPENSE_LIMIT && (
                          <button
                            type="button"
                            onClick={() => setShowAllExpenses((prev) => !prev)}
                            className={`cursor-pointer text-sm font-semibold text-[#c2570c] underline-offset-2 hover:underline ${FOCUS_RING}`}
                          >
                            {showAllExpenses ? "Thu gọn" : "Xem thêm"}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </section>
            </>
          ) : (
            /* Tab Tiền thưởng */
            <section aria-label="Tiền thưởng" className="mt-10">
              {filteredRows.length > 0 && (
                <p className="text-sm font-semibold text-[#2b2118]">
                  Tổng tiền thưởng tháng {monthNumber}: {formatCurrency(prizeTotal)}
                </p>
              )}
              <div className="mt-3 overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white">
                {filteredRows.length === 0 ? (
                  <p className="px-6 py-10 text-center text-[15px] text-[#6b6055]">
                    {prizeRows.length === 0 ? "Chưa có giải nào đã diễn ra" : "Không có khoản nào trong tháng này."}
                  </p>
                ) : (
                  <table className="w-full min-w-[1000px] border-separate border-spacing-0 text-left text-[15px]">
                    <thead>
                      <tr>
                        <th className={HEAD}>Ngày</th>
                        <th className={HEAD}>Giải đấu</th>
                        {showOwnerColumn && <th className={HEAD}>Chủ ngựa</th>}
                        <th className={HEAD}>Ngựa</th>
                        <th className={HEAD}>Hạng</th>
                        <th className={`${HEAD} text-right`}>Tiền thưởng</th>
                        <th className={HEAD}>Trạng thái</th>
                        <th className={`${HEAD} text-right`}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#2b2118] [&>tr:last-child>td]:border-b-0">
                      {filteredRows.map(({ registration, race, horse }) => {
                        const rank = registration.ThuHang;
                        const hasRank = rank !== null && rank !== undefined && rank >= 1;
                        const hasPrize = registration.TienThuong !== null && registration.TienThuong !== undefined;
                        const rewardMonth = race.Ngay.slice(0, 7);
                        const rewardStatus = hasPrize ? periodStatus("reward", horse.OwnerID, rewardMonth, today) : null;
                        return (
                          <tr key={`${race.RaceID}-${horse.HorseID}`} className="transition-colors hover:bg-[#f0efec]">
                            <td className={`${CELL} text-sm whitespace-nowrap text-[#4a3f33] tabular-nums`}>{formatDate(race.Ngay)}</td>
                            <td className={`${CELL} max-w-[220px] truncate`} title={race.TenGiai}>
                              {race.TenGiai}
                            </td>
                            {showOwnerColumn && (
                              <td className={`${CELL} max-w-[180px] truncate text-sm text-[#4a3f33]`} title={ownerName(horse.OwnerID)}>
                                {ownerName(horse.OwnerID)}
                              </td>
                            )}
                            <td className={`${CELL} font-serif font-semibold whitespace-nowrap`}>{horse.Ten}</td>
                            <td className={`${CELL} whitespace-nowrap`}>
                              {hasRank ? <span className="font-serif font-semibold">{formatRankWord(rank)}</span> : <span className="text-[#6b6055]">—</span>}
                            </td>
                            <td className={`${CELL} text-right font-semibold whitespace-nowrap tabular-nums`}>
                              {hasPrize ? formatCurrency(registration.TienThuong) : <span className="font-normal text-[#6b6055]">—</span>}
                            </td>
                            <td className={`${CELL} whitespace-nowrap`}>
                              {hasPrize ? (
                                <StatusText statusKey={rewardStatus} />
                              ) : hasRank ? (
                                <span className="text-sm font-semibold text-[#c2570c]">Chưa nhập</span>
                              ) : rank === NO_RANK ? (
                                <span className="text-sm text-[#6b6055]">Không xếp hạng</span>
                              ) : (
                                <span className="text-sm text-[#6b6055]">Chờ HLV nhập kết quả</span>
                              )}
                            </td>
                            <td className={`${CELL} text-right whitespace-nowrap`}>
                              {hasRank &&
                                (hasPrize ? (
                                  <span className="inline-flex items-center gap-4">
                                    {rewardStatus === "pending" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPaymentTarget({
                                            kind: "reward",
                                            ownerId: horse.OwnerID,
                                            ownerName: ownerName(horse.OwnerID),
                                            month: rewardMonth,
                                            amount: rewardTotalOf(horse.OwnerID, rewardMonth),
                                          })
                                        }
                                        className={OUTLINE_BUTTON}
                                      >
                                        Xác nhận đã chi
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setPrizeTarget({ race, horse, registration })}
                                      aria-label="Sửa"
                                      className={`${TEXT_ACTION} text-[#c2570c]`}
                                    >
                                      Sửa
                                    </button>
                                  </span>
                                ) : (
                                  <button type="button" onClick={() => setPrizeTarget({ race, horse, registration })} className={OUTLINE_BUTTON}>
                                    Nhập tiền thưởng
                                  </button>
                                ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {expenseDialog && (
        <ExpenseFormDialog
          key={expenseDialog.expense?.ExpenseID ?? "new"}
          expense={expenseDialog.expense}
          horses={horses}
          onSave={handleSaveExpense}
          onClose={() => setExpenseDialog(null)}
        />
      )}
      {prizeTarget && (
        <PrizeDialog
          key={`${prizeTarget.race.RaceID}-${prizeTarget.horse.HorseID}`}
          target={prizeTarget}
          onSave={handleSavePrize}
          onClose={() => setPrizeTarget(null)}
        />
      )}
      {paymentTarget && (
        <PaymentConfirmDialog
          key={`${paymentTarget.kind}-${paymentTarget.ownerId}-${paymentTarget.month}`}
          title={paymentTarget.kind === "expense" ? "Xác nhận đã nhận" : "Xác nhận đã chi"}
          message={
            paymentTarget.kind === "expense"
              ? `Xác nhận đã nhận ${formatCurrency(paymentTarget.amount)} từ ${paymentTarget.ownerName} cho tháng ${formatMonth(paymentTarget.month)}?`
              : `Xác nhận đã chi ${formatCurrency(paymentTarget.amount)} tiền thưởng cho ${paymentTarget.ownerName} tháng ${formatMonth(paymentTarget.month)}?`
          }
          dateLabel={paymentTarget.kind === "expense" ? "Ngày nhận" : "Ngày chi trả"}
          onConfirm={handleConfirmPayment}
          onClose={() => setPaymentTarget(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa chi phí"
        message={
          deleteTarget
            ? `Xóa khoản ${deleteTarget.LoaiChiPhi.toLocaleLowerCase("vi")} ${formatCurrency(deleteTarget.SoTien)} của ${horseName(deleteTarget.HorseID)}? Chủ ngựa sẽ không còn thấy khoản này.`
            : ""
        }
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
