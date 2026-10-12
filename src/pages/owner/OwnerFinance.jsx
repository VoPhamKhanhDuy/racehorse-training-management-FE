import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HorseIcon from "../../components/HorseIcon";
import LoadingState from "../../components/LoadingState";
import SectionTitle from "../../components/SectionTitle";
import useAuth from "../../hooks/useAuth";
import { getExpenses } from "../../services/expenseService";
import { getOwnerHorses, getRaceRegistrations, getRaces } from "../../services/ownerService";
import { formatCurrency } from "../../utils/currency";
import { formatDate, formatDayMonth, todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const HEAD_CELL = "text-xs font-medium tracking-wide text-stone uppercase";
const EXPENSE_LIMIT = 8;
const PRIZE_LIMIT = 8;
const RANK_WORDS = { 1: "Nhất", 2: "Nhì", 3: "Ba" };
const rankWord = (rank) => RANK_WORDS[rank] ?? `Hạng ${rank}`;

// Chênh lệch có dấu: "+12.500.000 đ" / "−3.200.000 đ" / "0 đ"
function formatDifference(amount) {
  if (amount === 0) return formatCurrency(0);
  return `${amount > 0 ? "+" : "−"}${formatCurrency(Math.abs(amount))}`;
}

const differenceClass = (amount) => (amount > 0 ? "text-[#2f7d4f]" : amount < 0 ? "text-[#c0262d]" : "text-stone");

// Nút "Xem thêm (N khoản)" / "Thu gọn" của 2 danh sách: chữ phụ gạch chân khi hover; "Thu gọn" in đậm
const toggleClass = (expanded) =>
  `mt-3 cursor-pointer pl-1 text-sm underline-offset-2 hover:text-ink hover:underline ${expanded ? "font-bold text-ink" : "text-stone"}`;

// "Chi phí & tiền thưởng" của Chủ ngựa — CHỈ XEM (không thanh toán, không QR, không trạng thái đã trả / chưa trả).
// Ngựa có HORSE.OwnerID = người đang đăng nhập. 3 khối: Tổng hợp theo ngựa (chi phí, tiền thưởng, chênh lệch + dòng Tổng),
// Chi phí gần đây (sổ cái, mới nhất trước), Tiền thưởng (RACEREGISTRATION.TienThuong).
export default function OwnerFinance() {
  const { user } = useAuth();
  const ownerId = toUserID(user.id);

  const [horses, setHorses] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showAllPrizes, setShowAllPrizes] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock expenseService / ownerService)
  useEffect(() => {
    let ignore = false;
    (async () => {
      const horseList = await getOwnerHorses(ownerId);
      const ids = horseList.map((h) => h.HorseID);
      const [expenseList, raceList, registrationList] = await Promise.all([getExpenses(ids), getRaces(), getRaceRegistrations()]);
      if (ignore) return;
      setHorses(horseList);
      setExpenses(expenseList);
      setRaces(raceList);
      setRegistrations(registrationList.filter((r) => ids.includes(r.HorseID)));
      setLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, [ownerId]);

  const horseName = (horseId) => horses.find((h) => h.HorseID === horseId)?.Ten ?? `Ngựa #${horseId}`;
  const prizes = registrations
    .filter((r) => r.TienThuong !== null && r.TienThuong !== undefined)
    .map((r) => ({ registration: r, race: races.find((race) => race.RaceID === r.RaceID) }))
    .filter(({ race }) => race)
    .sort((a, b) => b.race.Ngay.localeCompare(a.race.Ngay));

  const summaryRows = horses.map((horse) => {
    const cost = expenses.filter((e) => e.HorseID === horse.HorseID).reduce((sum, e) => sum + e.SoTien, 0);
    const prize = prizes.filter((p) => p.registration.HorseID === horse.HorseID).reduce((sum, p) => sum + p.registration.TienThuong, 0);
    return { horse, cost, prize, difference: prize - cost };
  });
  const total = summaryRows.reduce(
    (acc, row) => ({ cost: acc.cost + row.cost, prize: acc.prize + row.prize, difference: acc.difference + row.difference }),
    { cost: 0, prize: 0, difference: 0 }
  );
  const visibleExpenses = showAllExpenses ? expenses : expenses.slice(0, EXPENSE_LIMIT);
  const visiblePrizes = showAllPrizes ? prizes : prizes.slice(0, PRIZE_LIMIT);

  // Mẫu cột bảng tổng hợp
  // Cột Ngựa linh hoạt, 3 cột số cố định 140px canh phải (màn hẹp thu còn 104px)
  const summaryGrid = "grid grid-cols-[minmax(0,1fr)_104px_104px_112px] items-center gap-x-4 min-[900px]:grid-cols-[minmax(0,1fr)_140px_140px_140px]";

  return (
    <div className="max-w-[960px]">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Chi phí &amp; tiền thưởng</h1>
        <p className="mt-1 text-stone">
          Các khoản câu lạc bộ đã ghi cho ngựa của bạn. Việc thanh toán diễn ra ngoài hệ thống.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : horses.length === 0 ? (
        <div className="border-y border-stone/20 py-16 text-center">
          <p className="font-serif text-lg font-semibold text-ink">Chưa có ngựa nào gắn với tài khoản của bạn</p>
          <p className="mt-1.5 text-sm text-stone">Liên hệ Quản lý CLB để được thêm ngựa vào hồ sơ.</p>
        </div>
      ) : (
        <>
          <section aria-label="Tổng hợp theo ngựa">
            <SectionTitle subtitle={`Tính đến ${formatDate(todayISO())} · gồm mọi khoản đã ghi`}>Tổng hợp theo ngựa</SectionTitle>
            <div aria-hidden="true" className={`border-b border-stone/20 pr-2 pb-2 pl-1 ${summaryGrid}`}>
              <span className={HEAD_CELL}>Ngựa</span>
              <span className={`text-right ${HEAD_CELL}`}>Chi phí</span>
              <span className={`text-right ${HEAD_CELL}`}>Tiền thưởng</span>
              <span className={`text-right ${HEAD_CELL}`}>Chênh lệch</span>
            </div>
            <ul>
              {summaryRows.map(({ horse, cost, prize, difference }) => (
                <li key={horse.HorseID} className={`border-b border-stone/15 py-3 pr-2 pl-1 text-[15px] ${summaryGrid}`}>
                  <Link to={`/owner/horses/${horse.HorseID}`} className="group flex min-w-0 items-center gap-3 no-underline">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-stone/10 text-stone">
                      {horse.photo ? (
                        <img src={horse.photo} alt="" className="h-full w-full object-cover" style={{ objectPosition: horse.photoPosition ?? "center 30%" }} />
                      ) : (
                        <HorseIcon className="h-5 w-5" />
                      )}
                    </span>
                    <span className="truncate font-serif text-lg font-semibold text-[#2b2118] group-hover:underline">{horse.Ten}</span>
                  </Link>
                  <span className="text-right text-ink tabular-nums">{formatCurrency(cost)}</span>
                  <span className="text-right text-ink tabular-nums">{formatCurrency(prize)}</span>
                  <span className={`text-right font-semibold tabular-nums ${differenceClass(difference)}`}>{formatDifference(difference)}</span>
                </li>
              ))}
              <li className={`py-3 pr-2 pl-1 text-[15px] font-bold ${summaryGrid}`}>
                <span className="text-ink">Tổng</span>
                <span className="text-right text-ink tabular-nums">{formatCurrency(total.cost)}</span>
                <span className="text-right text-ink tabular-nums">{formatCurrency(total.prize)}</span>
                <span className={`text-right tabular-nums ${differenceClass(total.difference)}`}>{formatDifference(total.difference)}</span>
              </li>
            </ul>
          </section>

          <section aria-label="Chi phí gần đây" className="mt-14">
            <SectionTitle>Chi phí gần đây</SectionTitle>
            {expenses.length === 0 ? (
              <p className="text-sm text-stone">Chưa có khoản nào</p>
            ) : (
              <>
                <ul className="border-t border-stone/20">
                  {visibleExpenses.map((expense) => (
                    // 1 khoản / dòng, không xuống dòng: ngày 56px | loại 120px | "Tên ngựa · ghi chú" | số tiền canh phải
                    <li
                      key={expense.ExpenseID}
                      className="grid grid-cols-[56px_96px_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-stone/15 py-3 pr-2 pl-1 text-[15px] whitespace-nowrap min-[640px]:grid-cols-[56px_120px_minmax(0,1fr)_auto]"
                    >
                      <span className="text-stone tabular-nums">{formatDayMonth(expense.Ngay)}</span>
                      <span className="truncate text-stone">{expense.LoaiChiPhi}</span>
                      <span className="min-w-0 truncate text-ink" title={`${horseName(expense.HorseID)} · ${expense.GhiChu}`}>
                        {horseName(expense.HorseID)}
                        {expense.GhiChu && <span className="text-stone"> · {expense.GhiChu}</span>}
                      </span>
                      <span className="text-right text-ink tabular-nums">{formatCurrency(expense.SoTien)}</span>
                    </li>
                  ))}
                </ul>
                {expenses.length > EXPENSE_LIMIT && (
                  <button
                    type="button"
                    onClick={() => setShowAllExpenses((prev) => !prev)}
                    className={toggleClass(showAllExpenses)}
                  >
                    {showAllExpenses ? "Thu gọn" : `Xem thêm (${expenses.length - EXPENSE_LIMIT} khoản)`}
                  </button>
                )}
              </>
            )}
          </section>

          <section aria-label="Tiền thưởng" className="mt-14">
            <SectionTitle>Tiền thưởng</SectionTitle>
            {prizes.length === 0 ? (
              <p className="text-sm text-stone">Chưa có khoản nào</p>
            ) : (
              <>
              <ul className="border-t border-stone/20">
                {visiblePrizes.map(({ registration, race }) => (
                  <li
                    key={`${race.RaceID}-${registration.HorseID}`}
                    className="grid grid-cols-[56px_minmax(0,1fr)_56px_auto] items-baseline gap-x-4 border-b border-stone/15 py-3 pr-2 pl-1 text-[15px] whitespace-nowrap"
                  >
                    <span className="text-stone tabular-nums">{formatDayMonth(race.Ngay)}</span>
                    <span className="min-w-0 truncate text-ink" title={`${race.TenGiai} · ${horseName(registration.HorseID)}`}>
                      {race.TenGiai}
                      <span className="text-stone"> · {horseName(registration.HorseID)}</span>
                    </span>
                    <span className="font-serif font-semibold text-ink">
                      {registration.ThuHang >= 1 ? rankWord(registration.ThuHang) : ""}
                    </span>
                    <span className="text-right font-semibold text-ink tabular-nums">{formatCurrency(registration.TienThuong)}</span>
                  </li>
                ))}
              </ul>
              {prizes.length > PRIZE_LIMIT && (
                <button type="button" onClick={() => setShowAllPrizes((prev) => !prev)} className={toggleClass(showAllPrizes)}>
                  {showAllPrizes ? "Thu gọn" : `Xem thêm (${prizes.length - PRIZE_LIMIT} khoản)`}
                </button>
              )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
