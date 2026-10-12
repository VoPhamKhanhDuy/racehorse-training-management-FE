import HorseAvatar from "../../components/HorseAvatar";
import { HEALTH_INCIDENT_TYPES } from "../../data/incidentOptions";
import { formatDayMonth } from "../../utils/date";

// Mẫu cột của danh sách báo cáo — dùng chung cho hàng tiêu đề và từng hàng:
// Ngày (70px) | Ngựa (260px cố định) | Sự cố (phần còn lại) | ảnh thu nhỏ (48px, chỉ hiện khi có ảnh — không placeholder).
export const INCIDENT_GRID =
  "grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1.2fr)_48px] items-center gap-x-3 min-[900px]:grid-cols-[70px_260px_minmax(0,1fr)_48px] min-[900px]:gap-x-4";

// Loại sự cố hiển thị bằng chữ (không nền/viền), đậm 600; màu theo nhóm (biến CSS trong styles/index.css):
// liên quan ngựa → đỏ gạch trầm; chuồng/thiết bị hỏng, khác → nâu olive. Dùng ở hàng và ngăn chi tiết.
export const isAnimalIncident = (loaiSuCo) => HEALTH_INCIDENT_TYPES.includes(loaiSuCo);
export const getIncidentTypeText = (loaiSuCo) =>
  `font-semibold ${isAnimalIncident(loaiSuCo) ? "text-incident-animal" : "text-incident-facility"}`;

// 1 báo cáo sự cố = 1 hàng ~72px; cả hàng bấm được để mở ngăn chi tiết. selected: hàng đang mở (vạch cam + nền be).
// Sự cố liên quan ngựa: vạch đỏ gạch 2px ở mép trái (khi không chọn), không tô nền.
export default function IncidentReportRow({ report, horse, stable, selected, onSelect }) {
  const name = horse?.Ten ?? `Ngựa #${report.HorseID}`;
  const leftBar = selected ? "before:bg-brass" : isAnimalIncident(report.LoaiSuCo) ? "before:bg-incident-animal" : "before:hidden";

  return (
    <li className="border-b border-stone/15">
      <button
        type="button"
        onClick={() => onSelect(report)}
        aria-label={`Sự cố ${report.LoaiSuCo} – ${name}, ngày ${formatDayMonth(report.Ngay)}`}
        aria-current={selected ? "true" : undefined}
        className={`relative min-h-[72px] w-full cursor-pointer py-3 pr-2 pl-3 text-left text-sm outline-none transition-colors focus-visible:bg-[#f9f3e6] before:absolute before:inset-y-0 before:left-0 before:w-[2px] ${leftBar} ${INCIDENT_GRID} ${
          selected ? "bg-[#f7f1e5]" : "hover:bg-[#faf6ee]"
        }`}
      >
        <span className="text-ink tabular-nums">{formatDayMonth(report.Ngay)}</span>

        <span className="flex min-w-0 items-center gap-2">
          <HorseAvatar horse={horse} size={28} />
          <span className="min-w-0">
            <span className="block truncate font-serif text-base leading-tight font-semibold text-ink">{name}</span>
            {stable && <span className="block truncate text-xs text-stone">Chuồng {stable}</span>}
          </span>
        </span>

        <span className="min-w-0">
          <span className={`block truncate ${getIncidentTypeText(report.LoaiSuCo)}`}>{report.LoaiSuCo}</span>
          {report.MoTa && (
            <span className="mt-1 block truncate text-[13px] text-stone" title={report.MoTa}>
              {report.MoTa}
            </span>
          )}
        </span>

        <span>
          {report.HinhAnh && (
            <img src={report.HinhAnh} alt="" className="h-12 w-12 rounded-[4px] border border-stone/20 object-cover" />
          )}
        </span>
      </button>
    </li>
  );
}
