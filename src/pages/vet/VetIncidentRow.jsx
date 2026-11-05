import HorseAvatar from "../../components/HorseAvatar";
import { INCIDENT_STATUS } from "../../data/incidentOptions";
import { formatDate } from "../../utils/date";

// Ô bảng: kẻ ô 1px #E3E3E3 (ngang + dọc, ô cuối không kẻ dọc), padding 12px 16px, căn giữa dọc
const CELL = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// Trạng thái là chữ màu đậm 600 (không chấm, không icon): Mới đỏ, Đang xử lý cam, Đã xử lý xanh lá
const STATUS_COLOR = {
  [INCIDENT_STATUS.NEW]: "text-[#c0262d]",
  [INCIDENT_STATUS.IN_PROGRESS]: "text-[#c2570c]",
  [INCIDENT_STATUS.DONE]: "text-[#4d6b2a]",
};

// 1 hàng sự cố sức khỏe ngựa: STT | Ngày báo | Ngựa | Loại sự cố | Mô tả | Người báo | Trạng thái. Cả hàng bấm được (Enter/Space) mở modal chi tiết.
// Không icon, không màu theo loại sự cố (loại sự cố là chữ thường).
export default function VetIncidentRow({ index, report, horse, stable, onSelect }) {
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
      className="h-14 cursor-pointer bg-white transition-colors hover:bg-[#FAFAFA] focus-visible:bg-[#FAFAFA] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c]"
    >
      <td className={`${CELL} text-center text-[#6b6b6b] tabular-nums`}>{index}</td>
      <td className={`${CELL} whitespace-nowrap tabular-nums`}>{formatDate(report.Ngay)}</td>
      <td className={CELL}>
        <span className="flex min-w-0 items-center gap-2.5">
          <HorseAvatar horse={horse} size={32} square />
          <span className="min-w-0">
            <span className="block truncate font-semibold" title={report.HorseName}>
              {report.HorseName}
            </span>
            {stable && <span className="block truncate text-xs text-[#6b6b6b]">Chuồng {stable}</span>}
          </span>
        </span>
      </td>
      <td className={CELL}>
        <span className="block truncate" title={report.LoaiSuCo}>
          {report.LoaiSuCo}
        </span>
      </td>
      <td className={CELL}>
        {report.MoTa ? (
          <span className="block truncate" title={report.MoTa}>
            {report.MoTa}
          </span>
        ) : (
          <span className="text-[#B5B5B5]">—</span>
        )}
      </td>
      <td className={CELL}>
        <span className="block truncate" title={report.ReporterName}>
          {report.ReporterName}
        </span>
      </td>
      <td className={CELL}>
        <span className={`font-semibold whitespace-nowrap ${STATUS_COLOR[report.TrangThai] ?? "text-[#1f1f1f]"}`}>{report.TrangThai}</span>
      </td>
    </tr>
  );
}
