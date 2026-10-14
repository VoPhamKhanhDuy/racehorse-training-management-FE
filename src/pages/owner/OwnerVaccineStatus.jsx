import { getVaccineState } from "../../utils/healthAlerts";

// Màu chữ theo trạng thái hiển thị của getVaccineState (không pill/chấm): Quá hạn đỏ đậm; Sắp tới (≤ 7 ngày) cam đậm;
// Chờ tiêm chữ mực; Đã tiêm chữ nhạt.
const STATE_CLASSES = {
  "Quá hạn": "font-semibold text-[#c0262d]",
  "Sắp tới": "font-semibold text-[#d97706]",
  "Chờ tiêm": "text-ink",
  "Đã tiêm": "text-stone",
};

// Chữ trạng thái 1 lịch tiêm (VACCINATIONSCHEDULE) cho các trang của chủ ngựa
export default function OwnerVaccineStatus({ vaccination, className = "" }) {
  const state = getVaccineState(vaccination);
  return <span className={`${STATE_CLASSES[state] ?? "text-ink"} ${className}`}>{state}</span>;
}
