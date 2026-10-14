import HorseProfileSection from "./HorseProfileSection";
import { PLAN_UNITS, TRAINING_PHASES } from "../../data/trainingPlanOptions";

// Mục "Giáo án" trong hồ sơ ngựa: luôn đủ 4 giai đoạn, giai đoạn chưa lập ghi "Chưa lập"
export default function HorseProfilePlans({ horseId, plans, className }) {
  return (
    <HorseProfileSection
      title="Giáo án"
      link={{ to: `/trainer/plans?horse=${horseId}`, label: "Xem giáo án →" }}
      className={className}
    >
      {plans.length === 0 && <p className="mb-1 text-sm text-stone">Ngựa này chưa có giáo án cho giai đoạn nào.</p>}
      <ul>
        {TRAINING_PHASES.map((phase) => {
          const plan = plans.find((p) => p.GiaiDoan === phase);
          return (
            <li
              key={phase}
              className="grid grid-cols-[5.25rem_4.75rem_6rem_minmax(0,1fr)] gap-x-3 border-b border-stone/15 py-2.5 text-sm last:border-b-0 sm:grid-cols-[6.5rem_5rem_6.5rem_minmax(0,1fr)] sm:gap-x-4"
            >
              <span className="font-medium text-ink">{phase}</span>
              {plan ? (
                <>
                  <span className="text-ink tabular-nums">
                    {plan.CuLy.toLocaleString("vi-VN")} {PLAN_UNITS.CuLy}
                  </span>
                  <span className="text-ink tabular-nums">
                    {plan.KhoiLuong.toLocaleString("vi-VN")} {PLAN_UNITS.KhoiLuong}
                  </span>
                  <span className="truncate text-ink">Sân {plan.MatSan.toLowerCase()}</span>
                </>
              ) : (
                <span className="col-span-3 text-stone">Chưa lập</span>
              )}
            </li>
          );
        })}
      </ul>
    </HorseProfileSection>
  );
}
