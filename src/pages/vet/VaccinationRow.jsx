import { Link } from "react-router-dom";
import { Check, Clock, TriangleAlert } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";
import { daysBetween, daysSince, formatDate, todayISO } from "../../utils/date";

const CELL = "border-b border-[#d9cfba] px-4 py-3";
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

// Thời hạn: quá hạn → "Quá hạn N ngày" (đỏ + cảnh báo); sắp tới → "Còn N ngày" (cam + đồng hồ);
// chờ tiêm xa → "Còn N ngày" (chữ thường); đã tiêm → "Đã tiêm" (xanh + tick)
function dueInfo(item, state) {
  if (state === "Đã tiêm") return { text: "Đã tiêm", className: "font-semibold text-[#4d6b2a]", Icon: Check };
  if (state === "Quá hạn") {
    return { text: `Quá hạn ${daysSince(item.NgayHen)} ngày`, className: "font-semibold text-[#c0262d]", Icon: TriangleAlert };
  }
  const left = daysBetween(todayISO(), item.NgayHen);
  const text = left === 0 ? "Hôm nay" : `Còn ${left} ngày`;
  return state === "Sắp tới"
    ? { text, className: "font-semibold text-[#c2570c]", Icon: Clock }
    : { text, className: "text-[#4a3f33]", Icon: null };
}

// 1 lịch tiêm = 1 hàng bảng. state: trạng thái hiển thị (getVaccineState). Chưa tiêm: nút "Đã tiêm" + link "Sửa";
// đã tiêm: không có hành động (không sửa, không xóa).
export default function VaccinationRow({ item, state, horse, onMarkDone }) {
  const due = dueInfo(item, state);
  const pending = state !== "Đã tiêm";
  const horseName = horse?.Ten ?? `Ngựa #${item.HorseID}`;

  return (
    <tr className="text-[#2b2118] transition-colors hover:bg-[#f0efec]">
      <td className={`${CELL} whitespace-nowrap`}>
        <span className="flex items-center gap-3">
          <HorseAvatar horse={horse} size={36} square />
          <span className="font-serif text-base font-semibold">{horseName}</span>
        </span>
      </td>
      <td className={`${CELL} text-sm whitespace-nowrap`}>{item.Loai}</td>
      <td className={`${CELL} text-sm whitespace-nowrap tabular-nums`}>{formatDate(item.NgayHen)}</td>
      <td className={`${CELL} text-sm whitespace-nowrap ${due.className}`}>
        <span className="flex items-center gap-1.5">
          {due.Icon && <due.Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
          {due.text}
        </span>
      </td>
      <td className={`${CELL} w-[190px] min-w-[190px]`}>
        <span className="flex items-center justify-end gap-4">
          {pending && (
            <>
              <button
                type="button"
                onClick={() => onMarkDone(item)}
                aria-label={`Đánh dấu đã tiêm ${item.Loai} cho ${horse?.Ten ?? "ngựa"}`}
                className={`h-9 cursor-pointer rounded-[4px] border border-[#c2570c] bg-white px-3 text-sm font-semibold text-[#c2570c] transition-colors hover:bg-[#fbf3e6] ${FOCUS_RING}`}
              >
                Đã tiêm
              </button>
              <Link
                to={`/vet/vaccinations/${item.ScheduleID}/edit`}
                className={`text-sm font-semibold text-[#4a3f33] underline-offset-2 hover:text-[#2b2118] hover:underline ${FOCUS_RING}`}
              >
                Sửa
              </Link>
            </>
          )}
        </span>
      </td>
    </tr>
  );
}
