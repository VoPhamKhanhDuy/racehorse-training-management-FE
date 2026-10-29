import HorseAvatar from "../../components/HorseAvatar";
import { HEALTH_INCIDENT_TYPES } from "../../data/incidentOptions";
import { formatDate, formatDayMonth } from "../../utils/date";

// Loại sự cố hiển thị bằng chữ màu (không nền/viền), đậm 600. Dùng ở hàng và ngăn chi tiết.
const TYPE_COLOR = {
  "Vết thương": "text-[#c0262d]",
  "Khập khiễng": "text-[#c0262d]",
  "Bỏ ăn": "text-[#c2570c]",
  "Chuồng/thiết bị hỏng": "text-[#6b5a45]",
};
export const isAnimalIncident = (loaiSuCo) => HEALTH_INCIDENT_TYPES.includes(loaiSuCo);
export const getIncidentTypeText = (loaiSuCo) => `font-semibold ${TYPE_COLOR[loaiSuCo] ?? "text-[#6b6055]"}`;

const CELL = "border-b border-[#d9cfba] px-4 py-3";

// 1 báo cáo sự cố = 1 hàng bảng: Ngựa | Loại sự cố | Mô tả | Ngày báo. Cả hàng bấm được (Enter/Space) để mở ngăn chi tiết.
// selected: hàng đang mở trong ngăn chi tiết (nền xám nhạt).
export default function IncidentReportRow({ report, horse, stable, selected, onSelect }) {
  const name = horse?.Ten ?? `Ngựa #${report.HorseID}`;

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
      aria-label={`Sự cố ${report.LoaiSuCo} – ${name}, ngày ${formatDayMonth(report.Ngay)}`}
      aria-current={selected ? "true" : undefined}
      className={`cursor-pointer text-[#2b2118] transition-colors hover:bg-[#f0efec] focus-visible:bg-[#f0efec] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c] ${
        selected ? "bg-[#f0efec]" : ""
      }`}
    >
      <td className={`${CELL} whitespace-nowrap`}>
        <span className="flex items-center gap-3">
          <HorseAvatar horse={horse} size={36} square />
          <span className="min-w-0">
            <span className="block font-serif text-base leading-tight font-semibold">{name}</span>
            {stable && <span className="block text-[13px] text-[#6b6055]">Chuồng {stable}</span>}
          </span>
        </span>
      </td>
      <td className={`${CELL} text-sm whitespace-nowrap ${getIncidentTypeText(report.LoaiSuCo)}`}>{report.LoaiSuCo}</td>
      <td className={`${CELL} w-full max-w-0 text-sm`}>
        <span className="block truncate" title={report.MoTa}>
          {report.MoTa || <span className="text-[#6b6055]">—</span>}
        </span>
      </td>
      <td className={`${CELL} w-[130px] min-w-[130px] max-w-[130px] text-right text-sm whitespace-nowrap text-[#4a3f33] tabular-nums`}>
        {formatDate(report.Ngay)}
      </td>
    </tr>
  );
}
