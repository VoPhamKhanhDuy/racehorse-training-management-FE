import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import SectionTitle from "../../components/SectionTitle";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import ExpenseFormDialog from "./ExpenseFormDialog";
import PrizeDialog from "./PrizeDialog";
import styles from "./ManagerFinance.module.css";
import { createExpense, deleteExpense, getExpenses, updateExpense } from "../../services/expenseService";
import { getHorseOwners, getHorses } from "../../services/horseService";
import {
  dismissPrizeAlert,
  getPrizeAlerts,
  getRaceRegistrations,
  getRaces,
  setRaceRegistrationPrize,
} from "../../services/trainerService";
import { addAuditLog } from "../../services/auditService";
import { formatCurrency } from "../../utils/currency";
import { formatDate, todayISO } from "../../utils/date";
import { formatRankWord, NO_RANK } from "../../utils/raceResult";
import { toUserID } from "../../utils/userId";

const EXPENSE_LIMIT = 10;
const SELECT_CLASS =
  "h-9 cursor-pointer rounded-md border border-stone/25 bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brass";
const LINK_BUTTON = "cursor-pointer text-sm font-medium underline-offset-2 hover:underline";

// Chênh lệch có dấu: "+12.500.000 đ" / "−3.200.000 đ" / "0 đ"
function formatDifference(amount) {
  if (amount === 0) return formatCurrency(0);
  return `${amount > 0 ? "+" : "−"}${formatCurrency(Math.abs(amount))}`;
}
const differenceClass = (amount) => (amount > 0 ? "text-[#2f7d4f]" : amount < 0 ? "text-[#c0262d]" : "text-stone");

// "Tài chính" của Quản lý CLB: tổng hợp theo ngựa (lọc năm), sổ chi phí (thêm / sửa / xóa) và tiền thưởng của các giải đã diễn ra.
// Dùng CHUNG kho dữ liệu với /owner/finance (expenseService + RACEREGISTRATION.TienThuong) — chủ ngựa thấy sau khi tải lại trang.
// Không có thanh toán / QR / hóa đơn. Mỗi thao tác ghi đều ghi nhật ký (AUDITLOG).
export default function ManagerFinance() {
  const { user } = useAuth();
  const managerId = toUserID(user.id);
  const today = todayISO();
  const currentYear = today.slice(0, 4);

  const [horses, setHorses] = useState([]);
  const [owners, setOwners] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [year, setYear] = useState(currentYear);
  const [horseFilter, setHorseFilter] = useState("");
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(null); // { expense } — expense = null: thêm mới
  const [prizeTarget, setPrizeTarget] = useState(null); // { race, horse, registration }
  const [deleteTarget, setDeleteTarget] = useState(null); // expense
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock service)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getHorseOwners(), getExpenses(), getRaces(), getRaceRegistrations(), getPrizeAlerts()]).then(
      ([horseList, ownerList, expenseList, raceList, registrationList, alertList]) => {
        if (ignore) return;
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
    ).catch((err) => {
      if (ignore) return;
      setLoadError(err.message || "Không tải được chi phí và tiền thưởng.");
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const ownerById = Object.fromEntries(owners.map((o) => [o.UserID, o]));
  const raceById = Object.fromEntries(races.map((r) => [r.RaceID, r]));
  const horseName = (horseId) => horseById[horseId]?.Ten ?? `Ngựa #${horseId}`;

  // ---- Phần 1: tổng hợp theo ngựa (lọc năm) ----
  const years = [...new Set([currentYear, ...expenses.map((e) => e.Ngay.slice(0, 4)), ...races.map((r) => r.Ngay.slice(0, 4))])].sort().reverse();
  const summaryRows = horses.map((horse) => {
    const cost = expenses
      .filter((e) => e.HorseID === horse.HorseID && e.Ngay.startsWith(year))
      .reduce((sum, e) => sum + e.SoTien, 0);
    const prize = registrations
      .filter((r) => r.HorseID === horse.HorseID && r.TienThuong > 0 && raceById[r.RaceID]?.Ngay.startsWith(year))
      .reduce((sum, r) => sum + r.TienThuong, 0);
    return { horse, owner: ownerById[horse.OwnerID]?.HoTen ?? "Chưa rõ", cost, prize, difference: prize - cost };
  });
  const total = summaryRows.reduce(
    (acc, row) => ({ cost: acc.cost + row.cost, prize: acc.prize + row.prize, difference: acc.difference + row.difference }),
    { cost: 0, prize: 0, difference: 0 }
  );

  // ---- Phần 2: sổ chi phí ----
  const filteredExpenses = expenses.filter((e) => !horseFilter || String(e.HorseID) === horseFilter);
  const visibleExpenses = showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, EXPENSE_LIMIT);

  // ---- Phần 3: tiền thưởng của các lượt đăng ký giải ĐÃ diễn ra ----
  const prizeRows = registrations
    .map((registration) => ({ registration, race: raceById[registration.RaceID], horse: horseById[registration.HorseID] }))
    .filter(({ race, horse }) => race && horse && race.Ngay < today)
    .sort((a, b) => b.race.Ngay.localeCompare(a.race.Ngay) || a.horse.Ten.localeCompare(b.horse.Ten, "vi"));

  const audit = (HanhDong, TargetTable, TargetID, targetLabel) =>
    addAuditLog({ UserID: managerId, HanhDong, TargetTable, TargetID, targetLabel });
  const expenseSummaryText = (expense) => `${expense.LoaiChiPhi.toLocaleLowerCase("vi")} ${formatCurrency(expense.SoTien)}`;

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

  return (
    <div className="max-w-[1100px]">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Chi phí &amp; tiền thưởng</h1>
        <p className="mt-1 text-stone">Ghi nhận chi phí và tiền thưởng của từng ngựa. Chủ ngựa xem được các khoản này.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : (
        <>
          {/* Kết quả thi đấu đã đổi làm mất tiền thưởng cũ → Quản lý cần nhập lại */}
          {alerts.length > 0 && (
            <ul aria-label="Thông báo" className="mb-8 space-y-1.5">
              {alerts.map((alert) => (
                <li
                  key={alert.AlertID}
                  role="status"
                  className="flex items-start justify-between gap-4 border-l-2 border-[#d97706] bg-white/60 px-4 py-2.5 text-sm text-ink"
                >
                  <span>
                    Kết quả của <span className="font-medium">{horseName(alert.HorseID)}</span> tại{" "}
                    <span className="font-medium">{raceById[alert.RaceID]?.TenGiai ?? `giải #${alert.RaceID}`}</span> đã đổi, cần nhập lại
                    tiền thưởng
                  </span>
                  <button type="button" onClick={() => handleDismissAlert(alert)} className="shrink-0 cursor-pointer text-stone hover:text-ink hover:underline">
                    Đã xem
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* PHẦN 1 */}
          <section aria-label="Tổng hợp theo ngựa">
            <SectionTitle
              subtitle={`Tính đến ${formatDate(today)}`}
              action={
                <label className="flex items-center gap-2 text-sm text-stone">
                  Năm
                  <select value={year} onChange={(e) => setYear(e.target.value)} className={SELECT_CLASS} aria-label="Lọc theo năm">
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              }
            >
              Tổng hợp theo ngựa
            </SectionTitle>
            <div className={styles.scroll}>
              <div className={styles.table}>
                <div aria-hidden="true" className={`${styles.row} ${styles.summary} ${styles.head}`}>
                  <span>Ngựa</span>
                  <span>Chủ ngựa</span>
                  <span className={styles.num}>Chi phí</span>
                  <span className={styles.num}>Tiền thưởng</span>
                  <span className={styles.num}>Chênh lệch</span>
                </div>
                <ul>
                  {summaryRows.map(({ horse, owner, cost, prize, difference }) => (
                    <li key={horse.HorseID} className={`${styles.row} ${styles.summary} ${styles.body}`}>
                      <span className={styles.horse}>{horse.Ten}</span>
                      <span className={`${styles.ellipsis} ${styles.muted}`} title={owner}>
                        {owner}
                      </span>
                      <span className={`${styles.num} text-ink`}>{formatCurrency(cost)}</span>
                      <span className={`${styles.num} text-ink`}>{formatCurrency(prize)}</span>
                      <span className={`${styles.num} font-semibold ${differenceClass(difference)}`}>{formatDifference(difference)}</span>
                    </li>
                  ))}
                  <li className={`${styles.row} ${styles.summary} ${styles.total}`}>
                    <span className="text-ink">Tổng</span>
                    <span />
                    <span className={`${styles.num} text-ink`}>{formatCurrency(total.cost)}</span>
                    <span className={`${styles.num} text-ink`}>{formatCurrency(total.prize)}</span>
                    <span className={`${styles.num} ${differenceClass(total.difference)}`}>{formatDifference(total.difference)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* PHẦN 2 */}
          <section aria-label="Chi phí" className="mt-14">
            <SectionTitle
              action={
                <button type="button" onClick={() => setExpenseDialog({ expense: null })} className="btn-primary">
                  Thêm chi phí
                </button>
              }
            >
              Chi phí
            </SectionTitle>
            <div className="mb-3">
              <select
                value={horseFilter}
                onChange={(e) => {
                  setHorseFilter(e.target.value);
                  setShowAllExpenses(false);
                }}
                className={SELECT_CLASS}
                aria-label="Lọc theo ngựa"
              >
                <option value="">Tất cả ngựa</option>
                {horses.map((h) => (
                  <option key={h.HorseID} value={h.HorseID}>
                    {h.Ten}
                  </option>
                ))}
              </select>
            </div>
            {filteredExpenses.length === 0 ? (
              <p className="border-t border-stone/20 pt-3 text-sm text-stone">Chưa có khoản nào</p>
            ) : (
              <>
                <div className={styles.scroll}>
                  <div className={styles.table}>
                    <div aria-hidden="true" className={`${styles.row} ${styles.expense} ${styles.head}`}>
                      <span>Ngày</span>
                      <span>Ngựa</span>
                      <span>Loại</span>
                      <span>Ghi chú</span>
                      <span className={styles.num}>Số tiền</span>
                      <span />
                    </div>
                    <ul>
                      {visibleExpenses.map((expense) => (
                        <li key={expense.ExpenseID} className={`${styles.row} ${styles.expense} ${styles.body}`}>
                          <span className={`${styles.muted} tabular-nums`}>{formatDate(expense.Ngay)}</span>
                          <span className={styles.horse}>{horseName(expense.HorseID)}</span>
                          <span className={`${styles.ellipsis} ${styles.muted}`}>{expense.LoaiChiPhi}</span>
                          <span className={`${styles.ellipsis} text-ink`} title={expense.GhiChu}>
                            {expense.GhiChu || <span className="text-stone/60">—</span>}
                          </span>
                          <span className={`${styles.num} text-ink`}>{formatCurrency(expense.SoTien)}</span>
                          <span className={styles.actions}>
                            <button type="button" onClick={() => setExpenseDialog({ expense })} className={`${LINK_BUTTON} text-[#c2570c]`}>
                              Sửa
                            </button>
                            <button type="button" onClick={() => setDeleteTarget(expense)} className={`${LINK_BUTTON} text-[#c0262d]`}>
                              Xóa
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {filteredExpenses.length > EXPENSE_LIMIT && (
                  <button
                    type="button"
                    onClick={() => setShowAllExpenses((prev) => !prev)}
                    className={`mt-3 cursor-pointer pl-1 text-sm underline-offset-2 hover:text-ink hover:underline ${
                      showAllExpenses ? "font-bold text-ink" : "text-stone"
                    }`}
                  >
                    {showAllExpenses ? "Thu gọn" : `Xem thêm (${filteredExpenses.length - EXPENSE_LIMIT} khoản)`}
                  </button>
                )}
              </>
            )}
          </section>

          {/* PHẦN 3 */}
          <section aria-label="Tiền thưởng" className="mt-14">
            <SectionTitle>Tiền thưởng</SectionTitle>
            {prizeRows.length === 0 ? (
              <p className="border-t border-stone/20 pt-3 text-sm text-stone">Chưa có giải nào đã diễn ra</p>
            ) : (
              <div className={styles.scroll}>
                <div className={styles.table}>
                  <div aria-hidden="true" className={`${styles.row} ${styles.prize} ${styles.head}`}>
                    <span>Ngày</span>
                    <span>Giải</span>
                    <span>Ngựa</span>
                    <span>Hạng</span>
                    <span className={styles.num}>Tiền thưởng</span>
                    <span className={styles.num}>Thao tác</span>
                  </div>
                  <ul>
                    {prizeRows.map(({ registration, race, horse }) => {
                      const rank = registration.ThuHang;
                      const hasRank = rank !== null && rank !== undefined && rank >= 1;
                      const hasPrize = registration.TienThuong !== null && registration.TienThuong !== undefined;
                      return (
                        <li key={`${race.RaceID}-${horse.HorseID}`} className={`${styles.row} ${styles.prize} ${styles.body}`}>
                          <span className={`${styles.muted} tabular-nums`}>{formatDate(race.Ngay)}</span>
                          <span className={`${styles.ellipsis} text-ink`} title={race.TenGiai}>
                            {race.TenGiai}
                          </span>
                          <span className={styles.horse}>{horse.Ten}</span>
                          <span className={styles.ellipsis}>
                            {hasRank ? (
                              <span className="font-serif font-semibold text-ink">{formatRankWord(rank)}</span>
                            ) : rank === NO_RANK ? (
                              <span className="text-stone">Không xếp hạng</span>
                            ) : (
                              <span className="text-stone italic">Chờ HLV nhập kết quả</span>
                            )}
                          </span>
                          <span className={styles.num}>
                            {hasRank ? (
                              hasPrize ? (
                                <span className="font-semibold text-ink">{formatCurrency(registration.TienThuong)}</span>
                              ) : (
                                <span className="font-semibold text-[#d97706]">Chưa nhập</span>
                              )
                            ) : (
                              <span className="text-stone/60">—</span>
                            )}
                          </span>
                          <span className={styles.actions}>
                            {hasRank &&
                              (hasPrize ? (
                                <button
                                  type="button"
                                  onClick={() => setPrizeTarget({ race, horse, registration })}
                                  className={`${LINK_BUTTON} text-[#c2570c]`}
                                >
                                  Sửa
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPrizeTarget({ race, horse, registration })}
                                  className={styles.outlineButton}
                                >
                                  Nhập tiền thưởng
                                </button>
                              ))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </section>
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
