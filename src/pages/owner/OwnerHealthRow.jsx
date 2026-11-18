import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";
import OwnerVaccineStatus from "./OwnerVaccineStatus";
import { formatDate, formatDayMonth } from "../../utils/date";
import { getLockDays } from "../../utils/trainingLock";
import { isBlockingHealth } from "../../utils/healthGroups";

const CELL = "border-b border-[#d9cfba] px-4 py-2 align-middle";


// Sức khỏe: chữ màu; chỉ "Đang điều trị" có icon cảnh báo (trường hợp duy nhất cần nhấn). Trạng thái khác / chưa cập nhật → chữ xám.
const HEALTH_STYLES = {
  "Tốt": { className: "text-[#4d6b2a]", Icon: null },
  "Đủ điều kiện": { className: "text-[#4d6b2a]", Icon: null },
  "Cần theo dõi": { className: "text-[#946330]", Icon: null },
  "Đang điều trị": { className: "text-[#c0262d]", Icon: TriangleAlert },
  "Chấn thương": { className: "text-[#c0262d]", Icon: TriangleAlert },
  "Cách ly": { className: "text-[#c0262d]", Icon: TriangleAlert },
};

// 1 ngựa trong bảng "Tình trạng hiện tại" (chỉ xem; KHÔNG hiện chẩn đoán / lý do khóa tập): Ngựa | Sức khỏe | Thi đấu | Tiêm tiếp theo.
// health: HEALTHSTATUS; lock: { NgayDat, NgayGo } nếu đang khóa tập; nextVaccine: lịch Chờ tiêm sớm nhất (có thể undefined).
export default function OwnerHealthRow({ horse, health, lock, nextVaccine }) {
  const healthStyle = HEALTH_STYLES[health?.TrangThai];
  const HealthIcon = healthStyle?.Icon;
  const ready = !lock && !isBlockingHealth(health?.TrangThai);

  return (
    <tr className="h-16 text-[#2b2118] transition-colors hover:bg-[#f0efec]">
      <td className={`${CELL} whitespace-nowrap`}>
        <Link
          to={`/owner/horses/${horse.HorseID}`}
          className="group flex items-center gap-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
        >
          <HorseAvatar horse={horse} size={40} square />
          <span className="font-serif text-base font-semibold underline-offset-2 group-hover:underline">{horse.Ten}</span>
        </Link>
      </td>

      <td className={`${CELL} whitespace-nowrap`}>
        <span
          className={`flex items-center gap-1.5 text-sm ${healthStyle ? `font-medium ${healthStyle.className}` : "text-[#6b6055]"}`}
        >
          {HealthIcon && <HealthIcon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
          {health?.TrangThai ?? "Chưa cập nhật"}
        </span>
        {health?.NgayCapNhat && <span className="block text-[13px] text-[#6b6055]">cập nhật {formatDate(health.NgayCapNhat)}</span>}
      </td>

      <td className={`${CELL} whitespace-nowrap`}>
        {ready ? (
          <span className="text-sm font-medium text-[#4d6b2a]">Sẵn sàng</span>
        ) : (
          <>
            <span className="block text-sm font-medium text-[#c0262d]">Chưa thể thi đấu</span>
            {lock && <span className="block text-[13px] text-[#c2570c]">Đang tạm ngưng huấn luyện · {getLockDays(lock)} ngày</span>}
          </>
        )}
      </td>

      <td className={`${CELL} whitespace-nowrap`}>
        {nextVaccine ? (
          <>
            <span className="block text-sm">
              {nextVaccine.Loai} · <span className="tabular-nums">{formatDayMonth(nextVaccine.NgayHen)}</span>
            </span>
            <OwnerVaccineStatus vaccination={nextVaccine} className="block text-[13px]" />
          </>
        ) : (
          <span className="text-sm text-[#6b6055]">Chưa có lịch</span>
        )}
      </td>
    </tr>
  );
}
