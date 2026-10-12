import { Link } from "react-router-dom";
import HorseAvatar from "../../components/HorseAvatar";
import { daysBetween, daysSince, formatDate, todayISO } from "../../utils/date";

// Mẫu cột danh sách lịch tiêm — dùng chung cho hàng tiêu đề và từng hàng.
// ≥900px: Ngựa | Loại | Ngày hẹn | Thời hạn | Hành động. Hẹp hơn: bỏ Thời hạn; Loại xuống dưới tên ngựa,
// hàng hành động xuống dòng riêng (căn phải).
export const VACCINE_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 min-[900px]:grid-cols-[190px_minmax(0,1fr)_110px_130px_150px] min-[900px]:gap-y-0";

const CELL = {
  type: "col-start-1 row-start-2 min-[900px]:col-start-auto min-[900px]:row-start-auto",
  date: "col-start-2 row-start-1 text-right min-[900px]:col-start-auto min-[900px]:row-start-auto min-[900px]:text-left",
  actions: "col-span-2 row-start-3 min-[900px]:col-span-1 min-[900px]:row-start-auto",
};

// Thời hạn: quá hạn → "Quá hạn N ngày" (cam đậm); sắp tới → "Còn N ngày" (nâu); chờ tiêm xa → "Còn N ngày" (mờ); đã tiêm → "—"
function dueText(item, state) {
  if (state === "Đã tiêm") return { text: "—", className: "text-stone" };
  if (state === "Quá hạn") return { text: `Quá hạn ${daysSince(item.NgayHen)} ngày`, className: "font-medium text-brass-deep" };
  const left = daysBetween(todayISO(), item.NgayHen);
  const text = left === 0 ? "Hôm nay" : `Còn ${left} ngày`;
  return { text, className: state === "Sắp tới" ? "text-bark" : "text-stone" };
}

// 1 lịch tiêm = 1 hàng. state: trạng thái hiển thị (getVaccineState). Chưa tiêm: nút "Đã tiêm" + link "Sửa";
// đã tiêm: không có hành động (không sửa, không xóa).
export default function VaccinationRow({ item, state, horse, onMarkDone }) {
  const due = dueText(item, state);
  const pending = state !== "Đã tiêm";

  return (
    <li className={`border-b border-stone/15 py-2 pr-2 pl-3 text-sm transition-colors hover:bg-track/40 ${VACCINE_GRID} min-h-14`}>
      <span className="flex min-w-0 items-center gap-2">
        <HorseAvatar horse={horse} size={28} />
        <span className="truncate font-serif text-base font-semibold text-ink">{horse?.Ten ?? `Ngựa #${item.HorseID}`}</span>
      </span>
      <span className={`min-w-0 text-ink ${CELL.type}`}>{item.Loai}</span>
      <span className={`text-ink tabular-nums ${CELL.date}`}>{formatDate(item.NgayHen)}</span>
      <span className={`hidden min-[900px]:block ${due.className}`}>{due.text}</span>
      <span className={`flex items-center justify-end gap-3 ${CELL.actions} ${pending ? "" : "hidden min-[900px]:flex"}`}>
        {pending && (
          <>
            <button
              type="button"
              onClick={() => onMarkDone(item)}
              aria-label={`Đánh dấu đã tiêm ${item.Loai} cho ${horse?.Ten ?? "ngựa"}`}
              className="cursor-pointer rounded-sm border border-brass px-3 py-1 text-sm font-medium text-brass-deep transition-colors hover:bg-brass/10"
            >
              Đã tiêm
            </button>
            <Link
              to={`/vet/vaccinations/${item.ScheduleID}/edit`}
              className="text-sm text-stone underline-offset-2 hover:text-ink hover:underline"
            >
              Sửa
            </Link>
          </>
        )}
      </span>
    </li>
  );
}
