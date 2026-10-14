import TrainingBadge from "../../components/TrainingBadge";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { daysBetween, formatDate, todayISO } from "../../utils/date";
import { formatKm, formatMinutes } from "../../utils/trainingFormat";

const TH = "px-3 py-2.5 text-xs font-medium text-stone whitespace-nowrap";
const TD = "px-3 py-3 align-top";

// Bảng giai đoạn của giáo án (chỉ xem). markCurrent: đánh dấu "Đang diễn ra" cho giai đoạn chứa ngày hôm nay
// (chỉ bật với giáo án đang áp dụng — giáo án nháp / đã kết thúc / đã hủy thì không có giai đoạn nào đang diễn ra).
export default function PlanPhaseTable({ phases, markCurrent = false }) {
  const { label } = useTrainingOptions();
  const today = todayISO();

  if (!phases?.length) {
    return <p className="py-6 text-center text-sm text-stone">Giáo án chưa có giai đoạn nào.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone/15 bg-white">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-stone/15">
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
        <tbody className="divide-y divide-stone/10">
          {phases.map((phase, index) => {
            const isCurrent = markCurrent && phase.startDate <= today && today <= phase.endDate;
            return (
              <tr key={phase.phaseId ?? index} className={isCurrent ? "bg-brass/5" : ""}>
                <td className={`${TD} text-stone tabular-nums`}>{phase.phaseOrder ?? index + 1}</td>
                <td className={TD}>
                  <p className="font-medium text-ink">
                    {phase.phaseName}
                    {isCurrent && (
                      <span className="ml-2 inline-block rounded-sm bg-brass/15 px-1.5 py-px text-[11px] font-medium whitespace-nowrap text-brass-deep">
                        Đang diễn ra
                      </span>
                    )}
                  </p>
                  {phase.goal && <p className="mt-0.5 text-xs text-stone">{phase.goal}</p>}
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  {formatDate(phase.startDate)} – {formatDate(phase.endDate)}
                  <span className="block text-xs text-stone">{daysBetween(phase.startDate, phase.endDate) + 1} ngày</span>
                </td>
                <td className={TD}>
                  <TrainingBadge kind="intensity" code={phase.intensityLevel}>
                    {label("intensityLevels", phase.intensityLevel)}
                  </TrainingBadge>
                </td>
                <td className={`${TD} text-right tabular-nums`}>{phase.sessionsPerWeek}</td>
                <td className={`${TD} text-right whitespace-nowrap tabular-nums`}>
                  {formatKm(phase.targetDistanceKm)}
                  <span className="block text-xs text-stone">{formatMinutes(phase.sessionDurationMinutes)}</span>
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  {phase.surface ? label("surfaces", phase.surface) : <span className="text-stone">Theo bài tập</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
