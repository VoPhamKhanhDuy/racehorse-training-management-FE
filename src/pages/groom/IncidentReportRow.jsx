import HorseAvatar from "../../components/HorseAvatar";
import IncidentStatusBadge from "../../components/IncidentStatusBadge";
import { formatDate, formatDayMonth } from "../../utils/date";
import { capitalizeFirst } from "../../utils/text";

// (Đã bỏ getIncidentTypeText: chỉ export component để Fast Refresh hoạt động)

// Ô bảng: kẻ ô 1px tông ấm, padding 14px 16px, căn giữa dọc
const CELL = "border-r border-b border-[#e4dccb] px-4 py-3.5 align-middle text-sm text-[#2b2118] last:border-r-0";

// 1 báo cáo sự cố = 1 hàng bảng: Ngựa | Loại sự cố | Mô tả | Ngày báo | Trạng thái
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
      className={`h-14 cursor-pointer transition-colors hover:bg-[#faf6ee] focus-visible:bg-[#faf6ee] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c] ${
        selected ? "bg-[#fbf3e6]" : "bg-white"
      }`}
    >
      <td className={CELL}>
        <span className="flex min-w-0 items-center gap-2.5">
          <HorseAvatar horse={horse} size={34} square />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold" title={name}>
              {name}
            </span>
            {stable && <span className="block truncate text-xs text-[#6b6055]">Chuồng {stable}</span>}
          </span>
        </span>
      </td>
      <td className={CELL}>
        <span
          className="inline-flex max-w-full items-center truncate rounded-[4px] border border-[#dcd2be] bg-[#faf7f2] px-2.5 py-0.5 text-xs font-medium text-[#4a3f33]"
          title={report.LoaiSuCo}
        >
          {report.LoaiSuCo}
        </span>
      </td>
      <td className={CELL}>
        {description ? (
          <span className="line-clamp-2 break-words" title={description}>
            {description}
          </span>
        ) : (
          <span className="text-[#9a8f82]">—</span>
        )}
      </td>
      <td className={`${CELL} whitespace-nowrap text-[#4a3f33] tabular-nums`}>{formatDate(report.Ngay)}</td>
      <td className={CELL}>
        <IncidentStatusBadge status={report.TrangThai} />
      </td>
    </tr>
  );
}
