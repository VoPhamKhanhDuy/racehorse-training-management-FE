import HorseAvatar from "../../components/HorseAvatar";
import { HEALTH_INCIDENT_TYPES } from "../../data/incidentOptions";
import { formatDate, formatDayMonth } from "../../utils/date";

// Loại sự cố hiển thị bằng chữ màu (không nền/viền), đậm 600 — CHỈ còn dùng ở ngăn chi tiết (IncidentDetailDrawer). Bảng danh sách dùng chữ trung tính.
const TYPE_COLOR = {
  "Vết thương": "text-[#c0262d]",
  "Khập khiễng": "text-[#c0262d]",
  "Bỏ ăn": "text-[#c2570c]",
  "Chuồng/thiết bị hỏng": "text-[#6b5a45]",
};
export const isAnimalIncident = (loaiSuCo) => HEALTH_INCIDENT_TYPES.includes(loaiSuCo);
export const getIncidentTypeText = (loaiSuCo) => `font-semibold ${TYPE_COLOR[loaiSuCo] ?? "text-[#6b6055]"}`;

// Ô bảng: kẻ ô 1px #E3E3E3 (ngang + dọc, ô cuối không kẻ dọc), padding 12px 16px, căn giữa dọc
const CELL = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";
const capitalizeFirst = (text = "") => text.charAt(0).toUpperCase() + text.slice(1);

// 1 báo cáo sự cố = 1 hàng bảng: Ngựa | Loại sự cố | Mô tả | Ngày báo. Cả hàng bấm được (Enter/Space) để mở ngăn chi tiết.
// selected: hàng đang mở trong ngăn chi tiết. Bảng trung tính: hover / đang mở nền #FAFAFA, không zebra.
export default function IncidentReportRow({ report, horse, stable, selected, onSelect }) {
  const name = horse?.Ten ?? `Ngựa #${report.HorseID}`;
  const description = capitalizeFirst(report.MoTa ?? "");

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
      className={`h-14 cursor-pointer transition-colors hover:bg-[#FAFAFA] focus-visible:bg-[#FAFAFA] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c] ${
        selected ? "bg-[#FAFAFA]" : "bg-white"
      }`}
    >
      <td className={CELL}>
        <span className="flex min-w-0 items-center gap-2.5">
          <HorseAvatar horse={horse} size={32} square />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold" title={name}>
              {name}
            </span>
            {stable && <span className="block truncate text-xs text-[#6b6b6b]">Chuồng {stable}</span>}
          </span>
        </span>
      </td>
      <td className={`${CELL} font-medium`}>
        <span className="block truncate" title={report.LoaiSuCo}>
          {report.LoaiSuCo}
        </span>
      </td>
      <td className={CELL}>
        {description ? (
          <span className="line-clamp-2 break-words" title={description}>
            {description}
          </span>
        ) : (
          <span className="text-[#B5B5B5]">—</span>
        )}
      </td>
      <td className={`${CELL} text-right whitespace-nowrap tabular-nums`}>{formatDate(report.Ngay)}</td>
    </tr>
  );
}
