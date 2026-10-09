import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import SupplyFinanceReport from "./SupplyFinanceReport";
import TrainingPerformanceReport from "./TrainingPerformanceReport";
import { getSupplyFinanceReport, getTrainingReport } from "../../services/reportService";

// Báo cáo hiệu suất & tài chính — snapshot hiện tại, chưa lọc theo thời gian
export default function Reports() {
  const [trainingReport, setTrainingReport] = useState(null);
  const [financeReport, setFinanceReport] = useState(null);

  // TODO: thay bằng gọi API thật khi BE xong (hiện tính từ mock reportService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getTrainingReport(), getSupplyFinanceReport()]).then(([training, finance]) => {
      if (ignore) return;
      setTrainingReport(training);
      setFinanceReport(finance);
    });
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

      {!trainingReport || !financeReport ? (
        <LoadingState />
      ) : (
        // 1 khung duy nhất, 2 nửa ngăn bằng 1 đường hairline (dọc khi cạnh nhau từ xl, ngang khi xếp dọc) —
        // cùng cách chia ô của dải thống kê, không phải 2 card riêng
        <div className="grid divide-y divide-stone/15 rounded-lg border border-stone/15 bg-white xl:grid-cols-2 xl:divide-x xl:divide-y-0">
          <TrainingPerformanceReport report={trainingReport} />
          <SupplyFinanceReport report={financeReport} />
        </div>
      )}
    </div>
  );
}
