import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import IntensityText from "../../components/IntensityText";
import StatusText from "../../components/StatusText";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { formatDate, formatDayMonth } from "../../utils/date";
import { formatNumber } from "../../utils/trainingFormat";

// Lưới cột dùng chung cho hàng tiêu đề và các dòng (6 cột: ngựa, giáo án, thời gian, cường độ, tiến độ, trạng thái)
export const PLAN_ROW_GRID = "grid-cols-[200px_minmax(200px,1fr)_160px_90px_160px_160px]";
export const PLAN_TABLE_MIN_WIDTH = "min-w-[970px]";
// Ô: padding 12/16, kẻ cột bằng viền phải (cột cuối không có). Hàng grid không canh giữa (items-stretch) nên ô cao
// đủ chiều cao dòng, viền liền không hở; nội dung canh giữa dọc bằng flex trong ô.
export const PLAN_CELL = "flex min-w-0 flex-col justify-center border-r border-[#d9cfba] px-3 py-2 last:border-r-0";
// Ô tiêu đề: thấp hơn ô dữ liệu (~40px)
export const PLAN_HEAD_CELL = "flex min-w-0 flex-col justify-center border-r border-[#6b5a45] px-3 py-2 last:border-r-0";
// Viền ngoài khung và chân bảng; kẻ hàng / kẻ cột trong dòng nhạt hơn (#d9cfba), kẻ cột tiêu đề #6b5a45
export const PLAN_BORDER = "border-[#b9ab90]";

// Tên giáo án thường kết thúc bằng " - {tên ngựa}" — chỉ cắt khi hiển thị, dữ liệu và tìm kiếm không đổi
const displayPlanName = (plan) => {
  const suffix = ` - ${plan.horseName}`;
  return plan.horseName && plan.planName.endsWith(suffix) ? plan.planName.slice(0, -suffix.length) : plan.planName;
};

// "dd/mm – dd/mm/yyyy"; khác năm thì ghi đủ năm ở cả hai ngày
const formatPeriod = (startDate, endDate) =>
  startDate.slice(0, 4) === endDate.slice(0, 4)
    ? `${formatDayMonth(startDate)} – ${formatDate(endDate)}`
    : `${formatDate(startDate)} – ${formatDate(endDate)}`;

// Một dòng giáo án của bảng phẳng. Bấm dòng → onOpen (mở chi tiết).
export default function TrainingPlanRow({ plan, onOpen }) {
  const { label } = useTrainingOptions();
  const progress = plan.progress ?? {};
  const subtitle = [plan.trainingType && label("planTypes", plan.trainingType), plan.objective].filter(Boolean).join(" · ");

  return (
    <div
      role="row"
      onClick={onOpen}
      className={`grid min-h-14 cursor-pointer group relative border-b border-[#d9cfba] text-[13px] transition-colors duration-[120ms] last:border-b-0 hover:bg-[#f0efec] focus-within:before:absolute focus-within:before:inset-y-0 focus-within:before:left-0 focus-within:before:w-0.5 focus-within:before:bg-[#c2570c] ${PLAN_ROW_GRID}`}
    >
      <div role="cell" className={PLAN_CELL} title={plan.horseName}>
        <span className="font-serif text-base font-semibold break-words text-[#2b2118]">{plan.horseName}</span>
      </div>
      <div role="cell" className={PLAN_CELL}>
        <Link
          to={`/trainer/plans/${plan.planId}`}
          onClick={(e) => e.stopPropagation()}
          title={plan.planName}
          className="block truncate text-sm font-medium text-[#2b2118]"
        >
          {displayPlanName(plan)}
        </Link>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-[#6b6055]" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
      <div role="cell" className={`${PLAN_CELL} whitespace-nowrap text-[13px] text-[#2b2118]`}>
        <span>
        {formatPeriod(plan.startDate, plan.endDate)}
        </span>
        {plan.phaseCount > 0 && <span className="block text-xs text-[#6b6055]">{plan.phaseCount} giai đoạn</span>}
      </div>
      <div role="cell" className={PLAN_CELL}>
        {plan.intensityLevel ? (
          <IntensityText code={plan.intensityLevel}>{label("intensityLevels", plan.intensityLevel)}</IntensityText>
        ) : (
          <span className="text-[#6b6055]/60">—</span>
        )}
      </div>
      <div role="cell" className={PLAN_CELL}>
        {(progress.totalSessions ?? 0) === 0 ? (
          <span className="text-[#b8ad98]">—</span>
        ) : (
          <>
            <div className="h-1 w-[72px] overflow-hidden rounded-sm bg-[#e6dfd0]">
              <div className="h-full bg-[#6b7a3a]" style={{ width: `${Math.min(100, Number(progress.completionRate) || 0)}%` }} />
            </div>
            <p className="mt-1 truncate text-xs whitespace-nowrap text-[#2b2118]">
              {progress.completedSessions ?? 0}/{(progress.totalSessions ?? 0) - (progress.cancelledSessions ?? 0)} buổi
              {progress.averagePerformanceScore != null && ` · TB ${formatNumber(progress.averagePerformanceScore)}`}
            </p>
          </>
        )}
      </div>
      <div role="cell" className={PLAN_CELL}>
        <div className="flex items-center justify-between gap-2">
          <StatusText code={plan.status}>{label("planStatuses", plan.status)}</StatusText>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#8a7f6e] transition-colors group-hover:text-[#2b2118]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
