import HorseAvatar from "./HorseAvatar";
import { INCIDENT_STATUS } from "../data/incidentOptions";
import { formatDate } from "../utils/date";

// Ô bảng: kẻ ô 1px ấm áp, padding 12px 16px, căn giữa dọc
const CELL = "border-r border-b border-[#e4dccb] px-4 py-3.5 align-middle text-sm text-[#2b2118] last:border-r-0";

const STATUS_BADGE = {
  [INCIDENT_STATUS.NEW]: {
    wrap: "border-[#c0262d]/25 bg-[#c0262d]/10 text-[#b4232a]",
    dot: "bg-[#c0262d]",
  },
  [INCIDENT_STATUS.IN_PROGRESS]: {
    wrap: "border-[#c2570c]/25 bg-[#c2570c]/10 text-[#a8480a]",
    dot: "bg-[#c2570c]",
  },
  [INCIDENT_STATUS.DONE]: {
    wrap: "border-[#4d6b2a]/25 bg-[#4d6b2a]/12 text-[#3a541d]",
    dot: "bg-[#4d6b2a]",
  },
};

// 1 hàng sự cố (dùng chung Thú y / Quản lý): STT | Ngày báo | Ngựa | Loại sự cố | Mô tả | Người báo | Trạng thái. Cả hàng bấm được (Enter/Space) mở modal chi tiết.
export default function IncidentRow({ index, report, horse, stable, onSelect }) {
  const badge = STATUS_BADGE[report.TrangThai] ?? {
    wrap: "border-[#d6ccb8] bg-[#f6f1e7] text-[#4a3f33]",
    dot: "bg-[#6b6055]",
  };

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
      className="h-14 cursor-pointer bg-white transition-colors hover:bg-[#faf6ee] focus-visible:bg-[#faf6ee] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c]"
    >
      <td className={`${CELL} text-center font-medium text-[#6b6055] tabular-nums`}>{index}</td>
      <td className={`${CELL} whitespace-nowrap text-[#4a3f33] tabular-nums`}>{formatDate(report.Ngay)}</td>
      <td className={CELL}>
        <span className="flex min-w-0 items-center gap-2.5">
          <HorseAvatar horse={horse} size={34} square />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[#2b2118]" title={report.HorseName}>
              {report.HorseName}
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
        {report.MoTa ? (
          <span className="block truncate text-[#2b2118]" title={report.MoTa}>
            {report.MoTa}
          </span>
        ) : (
          <span className="text-[#9a8f82]">—</span>
        )}
      </td>
      <td className={CELL}>
        <span className="block truncate text-[#4a3f33]" title={report.ReporterName}>
          {report.ReporterName}
        </span>
      </td>
      <td className={CELL}>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${badge.wrap}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} aria-hidden="true" />
          {report.TrangThai}
        </span>
      </td>
    </tr>
  );
}
