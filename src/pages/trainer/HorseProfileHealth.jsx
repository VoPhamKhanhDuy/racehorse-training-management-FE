import HorseProfileSection from "./HorseProfileSection";
import { formatDate } from "../../utils/date";
import { getHealthStyle } from "../../utils/healthStatusStyles";

// Mục "Sức khỏe" trong hồ sơ ngựa. Phân quyền: HLV chỉ thấy trạng thái + ngày khám gần nhất,
// không có chẩn đoán / phác đồ / vị trí chấn thương (service cũng không trả các cột đó).
export default function HorseProfileHealth({ health, latestCheckup, className }) {
  return (
    <HorseProfileSection title="Sức khỏe" className={className}>
      {health ? (
        <p className="text-sm">
          <span className={`font-semibold ${getHealthStyle(health.TrangThai).text}`}>{health.TrangThai}</span>
          <span className="text-[#6b6055]"> · cập nhật {formatDate(health.NgayCapNhat)}</span>
        </p>
      ) : (
        <p className="text-sm text-[#6b6055]">Bác sĩ thú y chưa cập nhật tình trạng sức khỏe.</p>
      )}
      <p className="mt-2 text-sm text-[#2b2118]">
        {latestCheckup ? (
          `Ngày khám gần nhất: ${formatDate(latestCheckup.Ngay)}`
        ) : (
          <span className="text-[#6b6055]">Chưa có lần khám nào được ghi nhận.</span>
        )}
      </p>
      <p className="mt-2 text-[13px] text-[#6b6055]">Chẩn đoán và phác đồ điều trị do bác sĩ thú y quản lý.</p>
    </HorseProfileSection>
  );
}
