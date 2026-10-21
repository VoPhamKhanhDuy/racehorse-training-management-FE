import HorseProfileSection from "./HorseProfileSection";
import { formatDate } from "../../utils/date";
import { getVaccineState } from "../../utils/healthAlerts";

// Màu chữ theo trạng thái hiển thị (getVaccineState: "Quá hạn" tính từ "Chờ tiêm" + NgayHen đã qua) — chữ đậm, không nền/không chấm
const STATUS_TEXT = {
  "Quá hạn": "text-[#c0262d]",
  "Sắp tới": "text-[#946330]",
  "Chờ tiêm": "text-[#946330]",
  "Đã tiêm": "text-[#4d6b2a]",
};

// Mục "Vắc-xin" trong hồ sơ ngựa (vaccinations đã sắp NgayHen mới → cũ): mỗi mục trái = tên + ngày hẹn, phải = trạng thái
export default function HorseProfileVaccinations({ vaccinations, className }) {
  return (
    <HorseProfileSection title="Vắc-xin" className={className}>
      {vaccinations.length === 0 ? (
        <p className="text-sm text-[#6b6055]">Chưa có lịch tiêm phòng nào.</p>
      ) : (
        <ul>
          {vaccinations.map((v) => {
            const state = getVaccineState(v);
            return (
              <li key={v.ScheduleID} className="flex items-start justify-between gap-3 border-b border-[#ece5d6] py-2.5 last:border-b-0">
                <div className="min-w-0">
                  <p className="text-sm text-[#2b2118]">{v.Loai}</p>
                  <p className="text-[13px] text-[#6b6055] tabular-nums">Ngày hẹn {formatDate(v.NgayHen)}</p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${STATUS_TEXT[state] ?? "text-[#6b6055]"}`}>{state}</span>
              </li>
            );
          })}
        </ul>
      )}
    </HorseProfileSection>
  );
}
