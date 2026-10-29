import { Check } from "lucide-react";
import { getVaccineState } from "../../utils/healthAlerts";

// Chữ trạng thái theo trạng thái hiển thị của getVaccineState (không pill/nền; chỉ "Đã tiêm" có dấu tích): Quá hạn đỏ gạch dịu;
// Sắp tới (≤ 7 ngày) cam; Chờ tiêm xám; Đã tiêm xanh. Cỡ chữ và độ đậm do className của nơi dùng quyết định.
const STATE_COLORS = {
  "Quá hạn": "text-[#b3473f]",
  "Sắp tới": "text-[#c2570c]",
  "Chờ tiêm": "text-[#6b6055]",
  "Đã tiêm": "text-[#4d6b2a]",
};

// Trạng thái 1 lịch tiêm (VACCINATIONSCHEDULE) cho các trang của chủ ngựa
export default function OwnerVaccineStatus({ vaccination, className = "" }) {
  const state = getVaccineState(vaccination);
  return (
    <span className={`inline-flex items-center gap-1.5 ${STATE_COLORS[state] ?? "text-[#2b2118]"} ${className}`}>
      {state === "Đã tiêm" && <Check className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
      {state}
    </span>
  );
}
