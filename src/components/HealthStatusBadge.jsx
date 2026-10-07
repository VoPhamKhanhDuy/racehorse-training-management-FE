import { getHealthLabel, getHealthStyle } from "../utils/healthStatusStyles";

// Badge pill cho HEALTHSTATUS.TrangThai (nền pastel, bo tròn, không chấm, không viền) — kiểu duy nhất dùng toàn app.
// Không có bản ghi → "Chưa cập nhật" màu xám.
export default function HealthStatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getHealthStyle(status).badge} ${className}`}
    >
      {getHealthLabel(status)}
    </span>
  );
}
