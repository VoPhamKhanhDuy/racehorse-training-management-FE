import HorseSummary from "./HorseSummary";
import TrainingLockNotice from "./TrainingLockNotice";
import { PLAN_UNITS, TRAINING_PHASES } from "../../data/trainingPlanOptions";

const formatNumber = (value) => value.toLocaleString("vi-VN");

// Cột ngữ cảnh của form giáo án — cập nhật khi đổi ngựa: thông tin ngựa, cảnh báo khóa tập,
// và các giáo án đã lập của ngựa để HLV đối chiếu khi đặt số liệu cho giai đoạn mới.
// editingPlanId: giáo án đang sửa (đánh dấu "đang sửa" trong danh sách).
export default function PlanFormContext({ horse, healthStatus, lock, lockedByName, plans, editingPlanId }) {
  if (!horse) {
    return <p className="py-6 text-center text-sm text-stone">Chọn ngựa để xem thông tin và các giáo án đã lập.</p>;
  }

  // Giữ đúng thứ tự giai đoạn Nền tảng → Phục hồi
  const sortedPlans = [...plans].sort((a, b) => TRAINING_PHASES.indexOf(a.GiaiDoan) - TRAINING_PHASES.indexOf(b.GiaiDoan));

  return (
    <div className="space-y-5">
      <HorseSummary horse={horse} healthStatus={healthStatus} />
      {lock && <TrainingLockNotice lock={lock} lockedByName={lockedByName} />}

      <section aria-label="Giáo án đã lập" className="border-t border-stone/15 pt-4">
        <h3 className="font-serif text-base font-semibold text-ink">Giáo án đã lập</h3>
        {sortedPlans.length === 0 ? (
          <p className="mt-2 text-sm text-stone">Ngựa này chưa có giáo án nào</p>
        ) : (
          <ul className="mt-1">
            {sortedPlans.map((plan) => (
              <li key={plan.PlanID} className="border-b border-stone/15 py-2 text-sm last:border-b-0">
                <span className="font-medium text-ink">{plan.GiaiDoan}</span>
                <span className="text-stone tabular-nums">
                  {" "}
                  · {formatNumber(plan.CuLy)} {PLAN_UNITS.CuLy} · {formatNumber(plan.KhoiLuong)} {PLAN_UNITS.KhoiLuong} ·{" "}
                  {plan.MatSan}
                </span>
                {plan.PlanID === editingPlanId && <span className="ml-1.5 text-xs text-brass-deep">(đang sửa)</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
