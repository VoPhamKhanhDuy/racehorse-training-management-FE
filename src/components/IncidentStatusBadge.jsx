import { INCIDENT_STATUS } from "../data/incidentOptions";

// Huy hiệu trạng thái sự cố: Mới (đỏ) · Đang xử lý (cam) · Đã xử lý (xanh lá)
const STYLES = {
  [INCIDENT_STATUS.NEW]: { wrap: "border-[#c0262d]/25 bg-[#c0262d]/10 text-[#b4232a]", dot: "bg-[#c0262d]" },
  [INCIDENT_STATUS.IN_PROGRESS]: { wrap: "border-[#c2570c]/25 bg-[#c2570c]/10 text-[#a8480a]", dot: "bg-[#c2570c]" },
  [INCIDENT_STATUS.DONE]: { wrap: "border-[#4d6b2a]/25 bg-[#4d6b2a]/10 text-[#3a541d]", dot: "bg-[#4d6b2a]" },
};
const FALLBACK = { wrap: "border-[#d6ccb8] bg-[#f6f1e7] text-[#4a3f33]", dot: "bg-[#6b6055]" };

export default function IncidentStatusBadge({ status, className = "" }) {
  const style = STYLES[status] ?? FALLBACK;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${style.wrap} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {status || INCIDENT_STATUS.NEW}
    </span>
  );
}

