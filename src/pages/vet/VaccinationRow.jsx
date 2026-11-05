import { Link } from "react-router-dom";
import HorseAvatar from "../../components/HorseAvatar";
import { daysBetween, daysSince, formatDate, todayISO } from "../../utils/date";

// Ô bảng: kẻ ô 1px #E3E3E3 (ngang + dọc, ô cuối không kẻ dọc), padding 12px 16px, căn giữa dọc
const CELL = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// Thời hạn bằng chữ (không icon): quá hạn → "Quá hạn N ngày" cam đậm + chấm cam; sắp tới → "Còn N ngày" đậm; chờ tiêm xa → "Còn N ngày" xám; đã tiêm → "Đã tiêm" xám
function dueInfo(item, state) {
  if (state === "Đã tiêm") return { text: "Đã tiêm", className: "text-[#6b6b6b]", dot: false };
  if (state === "Quá hạn") return { text: `Quá hạn ${daysSince(item.NgayHen)} ngày`, className: "font-semibold text-[#c2570c]", dot: true };
  const left = daysBetween(todayISO(), item.NgayHen);
  const text = left <= 0 ? "Hôm nay" : `Còn ${left} ngày`;
  return state === "Sắp tới" ? { text, className: "font-semibold", dot: false } : { text, className: "text-[#6b6b6b]", dot: false };
}

// 1 lịch tiêm = 1 hàng: STT | Ngựa | Loại | Ngày hẹn | Thời hạn | Thao tác. Chưa tiêm: link cam "Ghi mũi tiêm" + "Sửa"; đã tiêm: không có thao tác (không sửa, không xóa).
export default function VaccinationRow({ index, item, state, horse, onMarkDone }) {
  const due = dueInfo(item, state);
  const pending = state !== "Đã tiêm";
  const horseName = horse?.Ten ?? `Ngựa #${item.HorseID}`;

  return (
    <tr className="h-14 bg-white transition-colors hover:bg-[#FAFAFA]">
      <td className={`${CELL} text-center text-[#6b6b6b] tabular-nums`}>{index}</td>
      <td className={CELL}>
        <span className="flex min-w-0 items-center gap-2.5">
          <HorseAvatar horse={horse} size={32} square />
          <span className="truncate font-semibold" title={horseName}>
            {horseName}
          </span>
        </span>
      </td>
      <td className={CELL}>
        <span className="block truncate" title={item.Loai}>
          {item.Loai}
        </span>
      </td>
      <td className={`${CELL} whitespace-nowrap tabular-nums`}>{formatDate(item.NgayHen)}</td>
      <td className={CELL}>
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${due.className}`}>
          {due.dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2570c]" aria-hidden="true" />}
          {due.text}
        </span>
      </td>
      <td className={CELL}>
        {pending ? (
          <span className="flex items-center gap-4 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onMarkDone(item)}
              aria-label={`Ghi mũi tiêm ${item.Loai} cho ${horseName}`}
              className="cursor-pointer font-semibold text-[#c2570c] hover:underline"
            >
              Ghi mũi tiêm
            </button>
            <Link to={`/vet/vaccinations/${item.ScheduleID}/edit`} className="font-medium text-[#6b6b6b] hover:text-[#1f1f1f] hover:underline">
              Sửa
            </Link>
          </span>
        ) : (
          <span className="text-[#B5B5B5]">—</span>
        )}
      </td>
    </tr>
  );
}
