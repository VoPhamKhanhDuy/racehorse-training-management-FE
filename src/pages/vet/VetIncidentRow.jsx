import { Check, CircleDot, Clock } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";
import { getIncidentStatusColor, getIncidentTypeColor } from "../manager/IncidentTableRow";
import { INCIDENT_STATUS } from "../../data/incidentOptions";
import { formatDate } from "../../utils/date";

const CELL = "border-b border-[#d9cfba] px-4 py-3";

// Mới → chấm; Đang xử lý → đồng hồ; Đã xử lý → tick
const STATUS_ICON = { [INCIDENT_STATUS.NEW]: CircleDot, [INCIDENT_STATUS.IN_PROGRESS]: Clock, [INCIDENT_STATUS.DONE]: Check };

// 1 hàng sự cố sức khỏe ngựa; cả hàng bấm được (Enter/Space) để mở ngăn chi tiết
export default function VetIncidentRow({ report, horse, stable, onSelect }) {
  const StatusIcon = STATUS_ICON[report.TrangThai] ?? CircleDot;

  return (
    <tr
      tabIndex={0}
      onClick={() => onSelect(report)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(report);
        }
      }}
      className="cursor-pointer text-[#2b2118] transition-colors hover:bg-[#f0efec] focus-visible:bg-[#f0efec] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c]"
    >
      <td className={`${CELL} whitespace-nowrap`}>
        <span className="flex items-center gap-3">
          <HorseAvatar horse={horse} size={36} square />
          <span className="min-w-0">
            <span className="block font-serif text-base leading-tight font-semibold">{report.HorseName}</span>
            {stable && <span className="block text-[13px] text-[#6b6055]">Chuồng {stable}</span>}
          </span>
        </span>
      </td>
      <td className={`${CELL} text-sm whitespace-nowrap font-semibold ${getIncidentTypeColor(report.LoaiSuCo)}`}>{report.LoaiSuCo}</td>
      <td className={`${CELL} text-sm whitespace-nowrap`}>
        <span className={`flex items-center gap-1.5 font-semibold ${getIncidentStatusColor(report.TrangThai)}`}>
          <StatusIcon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {report.TrangThai}
        </span>
      </td>
      <td className={`${CELL} w-full max-w-0 text-sm`}>
        <span className="block truncate" title={report.MoTa}>
          {report.MoTa || <span className="text-[#6b6055]">—</span>}
        </span>
      </td>
      <td className={`${CELL} hidden text-sm whitespace-nowrap md:table-cell`}>{report.ReporterName}</td>
      <td className={`${CELL} w-[130px] min-w-[130px] max-w-[130px] text-right text-sm whitespace-nowrap text-[#4a3f33] tabular-nums`}>
        {formatDate(report.Ngay)}
      </td>
    </tr>
  );
}
