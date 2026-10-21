import { DataCell, DataRow, DataTable } from "../../components/DataTable";
import HorseProfileSection from "./HorseProfileSection";
import { PLAN_UNITS, TRAINING_PHASES } from "../../data/trainingPlanOptions";

const COLUMNS = [
  { key: "phase", label: "Giai đoạn" },
  { key: "distance", label: "Cự ly" },
  { key: "volume", label: "Khối lượng" },
  { key: "surface", label: "Mặt sân" },
];
const TEMPLATE = "120px 110px 130px minmax(120px,1fr)";

// Mục "Giáo án" trong hồ sơ ngựa: chưa có giáo án nào → 1 câu + link; có thì bảng đủ 4 giai đoạn, giai đoạn chưa lập ghi "Chưa lập"
export default function HorseProfilePlans({ horseId, plans, className }) {
  return (
    <HorseProfileSection
      title="Giáo án"
      link={{ to: `/trainer/plans?horse=${horseId}`, label: "Xem giáo án →" }}
      className={className}
    >
      {plans.length === 0 ? (
        <p className="text-sm text-[#6b6055]">Ngựa này chưa có giáo án.</p>
      ) : (
        <DataTable columns={COLUMNS} template={TEMPLATE} minWidth={480} framed>
          {TRAINING_PHASES.map((phase) => {
            const plan = plans.find((p) => p.GiaiDoan === phase);
            return (
              <DataRow key={phase} template={TEMPLATE}>
                <DataCell className="font-medium text-[#2b2118]">{phase}</DataCell>
                {plan ? (
                  <>
                    <DataCell className="tabular-nums text-[#2b2118]">
                      {plan.CuLy.toLocaleString("vi-VN")} {PLAN_UNITS.CuLy}
                    </DataCell>
                    <DataCell className="tabular-nums text-[#2b2118]">
                      {plan.KhoiLuong.toLocaleString("vi-VN")} {PLAN_UNITS.KhoiLuong}
                    </DataCell>
                    <DataCell className="text-[#2b2118]">Sân {plan.MatSan.toLowerCase()}</DataCell>
                  </>
                ) : (
                  <DataCell className="col-span-3 text-[#6b6055]">Chưa lập</DataCell>
                )}
              </DataRow>
            );
          })}
        </DataTable>
      )}
    </HorseProfileSection>
  );
}
