import { Clock, TriangleAlert } from "lucide-react";

// Chú thích trạng thái dưới bảng lịch tiêm (cả Ma trận và Danh sách): icon mẫu + nhãn, 14px
export default function VaccinationLegend() {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#4a3f33]" aria-label="Chú thích">
      <li className="flex items-center gap-1.5">
        <TriangleAlert className="h-4 w-4 text-[#c0262d]" strokeWidth={2} aria-hidden="true" />
        Quá hạn
      </li>
      <li className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-[#c2570c]" strokeWidth={2} aria-hidden="true" />
        Sắp đến hạn
      </li>
      <li className="flex items-center gap-1.5">
        <span className="font-semibold text-[#b9ab90]" aria-hidden="true">
          —
        </span>
        Chưa có lịch
      </li>
    </ul>
  );
}
