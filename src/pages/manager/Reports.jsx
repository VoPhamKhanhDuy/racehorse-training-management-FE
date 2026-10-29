import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import FinanceSummaryRow from "./FinanceSummaryRow";
import SupplyFinanceReport from "./SupplyFinanceReport";
import TrainingPerformanceReport from "./TrainingPerformanceReport";
import { getExpenses } from "../../services/expenseService";
import { getSupplyFinanceReport, getTrainingReport } from "../../services/reportService";
import { getRaceRegistrations, getRaces } from "../../services/trainerService";
import { todayISO } from "../../utils/date";

// Báo cáo hiệu suất & tài chính — snapshot hiện tại, chưa lọc theo thời gian
export default function Reports() {
  const [trainingReport, setTrainingReport] = useState(null);
  const [financeReport, setFinanceReport] = useState(null);
  const [clubFinance, setClubFinance] = useState(null); // { cost, prize } của năm hiện tại

  // TODO: thay bằng gọi API thật khi BE xong (hiện tính từ mock reportService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getTrainingReport(), getSupplyFinanceReport(), getExpenses(), getRaces(), getRaceRegistrations()]).then(
      ([training, finance, expenses, races, registrations]) => {
        if (ignore) return;
        // Chi phí / tiền thưởng của cả CLB trong năm hiện tại — cùng nguồn với /manager/finance (tiền thưởng theo ngày giải)
        const year = todayISO().slice(0, 4);
        const raceYear = Object.fromEntries(races.map((r) => [r.RaceID, r.Ngay.slice(0, 4)]));
        const cost = expenses.filter((e) => e.Ngay.startsWith(year)).reduce((sum, e) => sum + e.SoTien, 0);
        const prize = registrations
          .filter((r) => r.TienThuong > 0 && raceYear[r.RaceID] === year)
          .reduce((sum, r) => sum + r.TienThuong, 0);
        setTrainingReport(training);
        setFinanceReport(finance);
        setClubFinance({ cost, prize });
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
          Báo cáo hiệu suất & tài chính
        </h1>
        <p className="mt-1 text-stone">Số liệu tại thời điểm hiện tại của câu lạc bộ.</p>
      </div>

      {!trainingReport || !financeReport || !clubFinance ? (
        <LoadingState />
      ) : (
        <>
          <FinanceSummaryRow summary={clubFinance} />
          {/* 1 khung duy nhất, 2 nửa ngăn bằng 1 đường hairline (dọc khi cạnh nhau từ xl, ngang khi xếp dọc) —
              cùng cách chia ô của dải thống kê, không phải 2 card riêng */}
          <div className="grid divide-y divide-stone/15 rounded-lg border border-stone/15 bg-white xl:grid-cols-2 xl:divide-x xl:divide-y-0">
            <TrainingPerformanceReport report={trainingReport} />
            <SupplyFinanceReport report={financeReport} />
          </div>
        </>
      )}
    </div>
  );
}
