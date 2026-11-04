import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";
import { formatDayMonth } from "../../utils/date";

// 1 sự cố sức khỏe ngựa mới (trạng thái "Mới") trong mục "Cần xử lý": cùng kiểu với OverviewActionItem; nút → /vet/incidents.
// report: từ getIncidentsForVet() (có HorseName, ReporterName); horse: hồ sơ ngựa để lấy ảnh (có thể undefined).
export default function OverviewIncidentItem({ report, horse }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#d9cfba] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[#f0efec] sm:flex-nowrap">
      <HorseAvatar horse={horse} size={44} square />
      <div className="min-w-0 flex-1 basis-[calc(100%-60px)] sm:basis-auto">
        <p className="font-serif text-[17px] leading-tight font-semibold text-[#2b2118]">{report.HorseName}</p>
        <p className="text-sm text-[#4a3f33]">
          <TriangleAlert className="mr-1.5 -mt-0.5 inline h-3.5 w-3.5 text-[#c0262d]" strokeWidth={2} aria-hidden="true" />
          Sự cố <span className="font-semibold text-[#c0262d]">{report.LoaiSuCo}</span> do {report.ReporterName} báo ngày{" "}
          {formatDayMonth(report.Ngay)}
        </p>
      </div>
      <div className="ml-auto shrink-0">
        <Link
          to="/vet/incidents"
          className="inline-flex h-9 items-center rounded-[4px] border border-[#c2570c] bg-white px-3 text-sm font-semibold whitespace-nowrap text-[#c2570c] transition-colors hover:bg-[#fbf3e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
        >
          Xem sự cố
        </Link>
      </div>
    </li>
  );
}
