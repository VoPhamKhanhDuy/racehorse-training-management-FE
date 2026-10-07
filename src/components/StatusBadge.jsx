import { getHealthStyle, isHealthStatus } from "../utils/healthStatusStyles";

// Nhãn trạng thái dạng "pill". Hiển thị đúng giá trị truyền vào, chỉ tô màu theo giá trị.
// Trạng thái sức khỏe (HEALTHSTATUS) lấy màu từ utils/healthStatusStyles để khớp HealthStatusBadge toàn app.
const badgeColors = {
  // TRAININGSESSION.ChiSoTap
  "Tốt": "bg-green-50 text-green-700",
  "Khá": "bg-orange-50 text-[#C65D18]",
  "Trung bình": "bg-yellow-50 text-yellow-700",
  "Kém": "bg-red-50 text-red-600",
};

export default function StatusBadge({ status }) {
  const className = isHealthStatus(status)
    ? getHealthStyle(status).badge
    : (badgeColors[status] ?? "bg-gray-100 text-gray-600");
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}>
      {status}
    </span>
  );
}
