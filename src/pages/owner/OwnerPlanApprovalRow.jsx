import HorseAvatar from "../../components/HorseAvatar";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { daysBetween, formatDate, formatDayMonth } from "../../utils/date";
import { PLAN_APPROVAL } from "../../utils/planStatus";
import OwnerPlanApprovalStatus from "./OwnerPlanApprovalStatus";

// Một hàng của bảng kế hoạch huấn luyện trên Lịch trình: Ngựa | Giáo án | Huấn luyện viên | Thời gian | nút.
// gridClass: lưới cột DÙNG CHUNG với dòng tiêu đề (từ md trở lên) để cột thẳng hàng; màn hẹp xếp dọc thành khối.
// Hàng chờ duyệt không có nhãn trạng thái (nút "Xem & duyệt" đã đủ ý); hàng đã quyết định hiện trạng thái nhỏ trong cột Giáo án.
// Bấm cả hàng hoặc nút đều mở chi tiết; duyệt ở trong modal chứ không ở hàng này.
export default function OwnerPlanApprovalRow({ record, horse, gridClass, onOpen }) {
  const { label } = useTrainingOptions({ remote: false });
  const plan = record.snapshot;
  const typeLabel = plan.trainingType ? label("planTypes", plan.trainingType) : "";
  const pending = record.status === PLAN_APPROVAL.PENDING;

  const handleButton = (e) => {
    e.stopPropagation();
    onOpen();
  };

  return (
    <li>
      <div onClick={onOpen} className={`${gridClass} cursor-pointer px-3 py-4 transition-colors hover:bg-[#FAFAFA]`}>
        <div className="flex min-w-0 items-center gap-3 pr-4">
          <HorseAvatar horse={horse} size={44} square />
          <span title={plan.horseName} className="min-w-0 truncate font-serif text-lg font-semibold whitespace-nowrap text-[#2b2118]">
            {plan.horseName}
          </span>
        </div>
        <div className="min-w-0 pr-4 pt-1 md:pt-0">
          <p title={plan.planName} className="truncate text-[15px] whitespace-nowrap text-[#2b2118]">
            {plan.planName}
          </p>
          {typeLabel && <p className="truncate text-sm text-[#6b6055]">{typeLabel}</p>}
          {!pending && <OwnerPlanApprovalStatus status={record.status} small />}
        </div>
        <p title={plan.trainerName} className="min-w-0 truncate pr-4 text-[15px] whitespace-nowrap text-[#4a3f33]">
          <span className="md:hidden">Huấn luyện viên </span>
          {plan.trainerName}
        </p>
        <div className="min-w-0 pr-4 tabular-nums">
          <p className="text-[15px] whitespace-nowrap text-[#4a3f33]">
            {formatDayMonth(plan.startDate)} – {formatDate(plan.endDate)}
          </p>
          <p className="text-sm text-[#6b6055]">{daysBetween(plan.startDate, plan.endDate) + 1} ngày</p>
        </div>
        <div className="mt-2 md:mt-0 md:text-right">
          {pending ? (
            <button
              type="button"
              onClick={handleButton}
              className="inline-flex h-10 cursor-pointer items-center rounded-[4px] bg-brass-deep px-4 text-[15px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-brass-deep/90"
            >
              Xem & duyệt
            </button>
          ) : (
            <button type="button" onClick={handleButton} className="cursor-pointer text-[15px] font-semibold whitespace-nowrap text-[#c2570c] hover:underline">
              Xem
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
