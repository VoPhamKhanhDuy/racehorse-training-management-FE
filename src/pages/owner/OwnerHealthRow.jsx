import { Link } from "react-router-dom";
import HorseIcon from "../../components/HorseIcon";
import OwnerVaccineStatus from "./OwnerVaccineStatus";
import { formatDate, formatDayMonth } from "../../utils/date";
import { getLockDays } from "../../utils/trainingLock";
import { OWNER_HEALTH_COLORS } from "../../utils/ownerHealthText";

// Mẫu cột bảng "Tình trạng hiện tại" — dùng chung cho hàng tiêu đề và từng hàng:
// Ngựa | Sức khỏe | Thi đấu | Tiêm tiếp theo. Màn hẹp: 2 cột, mỗi ngựa 2 dòng ô (không có hàng tiêu đề).
export const OWNER_HEALTH_GRID =
  "grid grid-cols-2 items-start gap-x-4 gap-y-2 min-[900px]:grid-cols-[minmax(0,1.2fr)_180px_minmax(0,1fr)_minmax(0,1fr)] min-[900px]:items-center";

// Trạng thái sức khỏe chặn thi đấu (cùng quy tắc đăng ký giải của HLV)
const BLOCKING_HEALTH = "Đang điều trị";

// 1 ngựa trong bảng "Tình trạng hiện tại" (chỉ xem; KHÔNG hiện chẩn đoán / lý do khóa tập):
// health: HEALTHSTATUS; lock: { NgayDat, NgayGo } nếu đang khóa tập; nextVaccine: lịch Chờ tiêm sớm nhất (có thể undefined).
export default function OwnerHealthRow({ horse, health, lock, nextVaccine }) {
  const healthColor = OWNER_HEALTH_COLORS[health?.TrangThai];
  const ready = !lock && health?.TrangThai !== BLOCKING_HEALTH;

  return (
    <li className={`border-b border-stone/15 py-3 pr-2 pl-1 text-[15px] ${OWNER_HEALTH_GRID}`}>
      <Link to={`/owner/horses/${horse.HorseID}`} className="group col-span-2 flex min-w-0 items-center gap-3 min-[900px]:col-span-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-stone/10 text-stone">
          {horse.photo ? (
            <img src={horse.photo} alt="" className="h-full w-full object-cover" style={{ objectPosition: horse.photoPosition ?? "center 30%" }} />
          ) : (
            <HorseIcon className="h-5 w-5" />
          )}
        </span>
        <span className="truncate font-serif text-lg font-semibold text-[#2b2118] underline-offset-2 group-hover:underline">{horse.Ten}</span>
      </Link>

      <span className="min-w-0">
        <span className={`block ${healthColor ? "font-semibold" : "text-stone"}`} style={healthColor ? { color: healthColor } : undefined}>
          {health?.TrangThai ?? "Chưa cập nhật"}
        </span>
        {health?.NgayCapNhat && <span className="block text-xs text-stone">cập nhật {formatDate(health.NgayCapNhat)}</span>}
      </span>

      <span className="min-w-0">
        {ready ? (
          <span className="block text-ink">Sẵn sàng</span>
        ) : (
          <>
            <span className="block text-ink">Chưa thể thi đấu</span>
            {lock && <span className="block text-xs text-brass-deep">Đang tạm ngưng huấn luyện · {getLockDays(lock)} ngày</span>}
          </>
        )}
      </span>

      <span className="min-w-0">
        {nextVaccine ? (
          <>
            <span className="block truncate text-ink">
              {nextVaccine.Loai} · <span className="tabular-nums">{formatDayMonth(nextVaccine.NgayHen)}</span>
            </span>
            <OwnerVaccineStatus vaccination={nextVaccine} className="block text-xs" />
          </>
        ) : (
          <span className="text-stone">Chưa có lịch</span>
        )}
      </span>
    </li>
  );
}
