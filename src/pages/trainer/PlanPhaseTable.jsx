import { DataCell, DataRow, DataTable } from "../../components/DataTable";
import IntensityText from "../../components/IntensityText";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { daysBetween, formatDate, todayISO } from "../../utils/date";
import { formatKm, formatMinutes } from "../../utils/trainingFormat";

const TH = "px-3 py-2.5 text-xs font-medium text-[#6b6055] whitespace-nowrap";
const TD = "px-3 py-3 align-top";

// Giai đoạn của giáo án (chỉ xem). markCurrent: đánh dấu giai đoạn chứa ngày hôm nay
// (chỉ bật với giáo án đang áp dụng — giáo án nháp / đã kết thúc / đã hủy thì không có giai đoạn nào đang diễn ra).
// variant="framed": bảng có khung dùng chung (tiêu đề nâu, chân "N giai đoạn") cho trang chi tiết giáo án; mặc định là bảng đầy đủ cột.
// Giai đoạn đang diễn ra chỉ nhấn bằng vạch cam 2px bên trái + tên in đậm, không nền / nhãn.
export default function PlanPhaseTable({ phases, markCurrent = false, variant = "table" }) {
  const { label } = useTrainingOptions();
  const today = todayISO();

  if (!phases?.length) {
    return <p className="py-6 text-center text-sm text-[#6b6055]">Giáo án chưa có giai đoạn nào.</p>;
  }

  if (variant === "framed") {
    const columns = [
      { key: "phase", label: "Giai đoạn" },
      { key: "time", label: "Thời gian" },
      { key: "intensity", label: "Cường độ tối đa" },
      { key: "sessions", label: "Buổi/tuần" },
      { key: "perSession", label: "Mỗi buổi" },
      { key: "surface", label: "Mặt sân" },
    ];
    const template = "minmax(220px,1.6fr) 190px 130px 90px 130px 130px";
    return (
      <DataTable columns={columns} template={template} minWidth={900} footer={`${phases.length} giai đoạn`} framed>
        {phases.map((phase, index) => {
          const isCurrent = markCurrent && phase.startDate <= today && today <= phase.endDate;
          return (
            <DataRow
              key={phase.phaseId ?? index}
              template={template}
              className={`border-l-2 ${isCurrent ? "border-l-[#c2570c]" : "border-l-transparent"}`}
            >
              <DataCell>
                <p className={`text-sm text-[#2b2118] ${isCurrent ? "font-semibold" : "font-medium"}`}>{phase.phaseName}</p>
                {phase.goal && <p className="text-[13px] text-[#6b6055]">{phase.goal}</p>}
              </DataCell>
              <DataCell className="whitespace-nowrap text-[#2b2118]">
                {formatDate(phase.startDate)} – {formatDate(phase.endDate)}
                <span className="block text-xs text-[#6b6055]">{daysBetween(phase.startDate, phase.endDate) + 1} ngày</span>
              </DataCell>
              <DataCell>
                <IntensityText code={phase.intensityLevel}>{label("intensityLevels", phase.intensityLevel)}</IntensityText>
              </DataCell>
              <DataCell className="tabular-nums">{phase.sessionsPerWeek}</DataCell>
              <DataCell className="whitespace-nowrap tabular-nums">
                {formatKm(phase.targetDistanceKm)} · {formatMinutes(phase.sessionDurationMinutes)}
              </DataCell>
              <DataCell className="whitespace-nowrap">
                {phase.surface ? label("surfaces", phase.surface) : <span className="text-[#6b6055]">Theo bài tập</span>}
              </DataCell>
            </DataRow>
          );
        })}
      </DataTable>
    );
  }

  return (
    <div className="overflow-x-auto border-t border-[#ece5d6] bg-white">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-[#ece5d6]">
          <tr>
            <th className={TH}>#</th>
            <th className={TH}>Giai đoạn</th>
            <th className={TH}>Thời gian</th>
            <th className={TH}>Cường độ tối đa</th>
            <th className={`${TH} text-right`}>Buổi/tuần</th>
            <th className={`${TH} text-right`}>Mỗi buổi</th>
            <th className={TH}>Mặt sân</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ece5d6]">
          {phases.map((phase, index) => {
            const isCurrent = markCurrent && phase.startDate <= today && today <= phase.endDate;
            return (
              <tr key={phase.phaseId ?? index}>
                <td className={`${TD} text-[#6b6055] tabular-nums`}>{phase.phaseOrder ?? index + 1}</td>
                <td className={TD}>
                  <p className={`text-[#2b2118] ${isCurrent ? "font-semibold" : "font-medium"}`}>{phase.phaseName}</p>
                  {phase.goal && <p className="mt-0.5 text-xs text-[#6b6055]">{phase.goal}</p>}
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  {formatDate(phase.startDate)} – {formatDate(phase.endDate)}
                  <span className="block text-xs text-[#6b6055]">{daysBetween(phase.startDate, phase.endDate) + 1} ngày</span>
                </td>
                <td className={TD}>
                  <IntensityText code={phase.intensityLevel}>{label("intensityLevels", phase.intensityLevel)}</IntensityText>
                </td>
                <td className={`${TD} text-right tabular-nums`}>{phase.sessionsPerWeek}</td>
                <td className={`${TD} text-right whitespace-nowrap tabular-nums`}>
                  {formatKm(phase.targetDistanceKm)}
                  <span className="block text-xs text-[#6b6055]">{formatMinutes(phase.sessionDurationMinutes)}</span>
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  {phase.surface ? label("surfaces", phase.surface) : <span className="text-[#6b6055]">Theo bài tập</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
