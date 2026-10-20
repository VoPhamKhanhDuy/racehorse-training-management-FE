import { statusDisplayLabel } from "../utils/statusLabels";

// Trạng thái dạng chữ đậm 600, không nền/viền. Màu theo mã trạng thái của giáo án / buổi tập.
const STATUS_COLORS = {
  Active: "text-[#2f7d4f]",
  InProgress: "text-[#2f7d4f]",
  Completed: "text-[#6b6055]",
  Cancelled: "text-[#c0262d]",
  Draft: "text-[#6b6055]",
  Planned: "text-[#6b6055]",
  Scheduled: "text-[#6b6055]",
};


export default function StatusText({ code, children }) {
  return (
    <span className={`text-sm font-semibold whitespace-nowrap ${STATUS_COLORS[code] ?? "text-[#6b6055]"}`}>
      {statusDisplayLabel(code, children)}
    </span>
  );
}
