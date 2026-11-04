import { formatDate } from "../../utils/date";

// Màu chữ theo loại sự cố (trạng thái là chữ màu, không dùng pill)
const TYPE_COLOR = {
  "Vết thương": "text-[#c0262d]",
  "Khập khiễng": "text-[#c0262d]",
  "Bỏ ăn": "text-[#c2570c]",
  "Chuồng/thiết bị hỏng": "text-[#6b5a45]",
};

export const getIncidentTypeColor = (loaiSuCo) => TYPE_COLOR[loaiSuCo] ?? "text-[#6b6055]";

const STATUS_COLOR = {
  "Mới": "text-[#c0262d]",
  "Đang xử lý": "text-[#c2570c]",
  "Đã xử lý": "text-[#4d6b2a]",
};

export const getIncidentStatusColor = (trangThai) => STATUS_COLOR[trangThai] ?? "text-[#6b6055]";

const CELL = "border-b border-[#d9cfba] px-4 py-3";

// 1 hàng báo cáo sự cố; cả hàng bấm được (Enter/Space) để mở ngăn chi tiết chỉ đọc
export default function IncidentTableRow({ report, onSelect }) {
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
      className="cursor-pointer text-[#2b2118] transition-colors hover:bg-[#f0efec] focus-visible:bg-[#f0efec] focus-visible:outline-none"
    >
      <td className={`${CELL} whitespace-nowrap font-medium`}>{report.HorseName}</td>
      <td className={`${CELL} whitespace-nowrap font-semibold ${getIncidentTypeColor(report.LoaiSuCo)}`}>{report.LoaiSuCo}</td>
      <td className={`${CELL} whitespace-nowrap font-semibold ${getIncidentStatusColor(report.TrangThai)}`}>{report.TrangThai}</td>
      <td className={`${CELL} w-full max-w-0`}>
        <span className="block truncate" title={report.MoTa}>
          {report.MoTa || <span className="text-[#6b6055]">—</span>}
        </span>
      </td>
      <td className={`${CELL} hidden whitespace-nowrap md:table-cell`}>{report.ReporterName}</td>
      <td className={`${CELL} w-[130px] min-w-[130px] max-w-[130px] whitespace-nowrap text-right text-sm tabular-nums text-[#4a3f33]`}>
        {formatDate(report.Ngay)}
      </td>
    </tr>
  );
}
