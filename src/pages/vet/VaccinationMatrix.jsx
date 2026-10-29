import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, TriangleAlert } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";
import VaccinationLegend from "./VaccinationLegend";
import { daysBetween, daysSince, formatDate, formatDayMonth } from "../../utils/date";
import { getCellRepresentative, getVaccineColumns } from "../../utils/vaccinationMatrix";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c]";
const HEAD = "border-b border-[#b9ab90] bg-[#f3ede0] px-3 py-3 text-[13px] font-semibold text-[#2b2118]";
const MIN_COLUMN_WIDTH = 160;
const HORSE_COLUMN_WIDTH = 220;

// Hàng cần chú ý trước: có quá hạn → có sắp tới → còn lại
const rowRank = (states) => (states.includes("Quá hạn") ? 0 : states.includes("Sắp tới") ? 1 : 2);

// Nội dung trong ô (không tô nền): trạng thái là chữ màu + icon, dòng dưới là ngày hẹn
function CellText({ item, state, today }) {
  if (state === "Quá hạn") {
    return (
      <>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#c0262d]">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Quá hạn {daysSince(item.NgayHen)} ngày
        </span>
        <span className="block text-[13px] text-[#6b6055]">hẹn {formatDayMonth(item.NgayHen)}</span>
      </>
    );
  }
  if (state === "Sắp tới") {
    const left = daysBetween(today, item.NgayHen);
    return (
      <>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#c2570c]">
          <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          {left === 0 ? "Hôm nay" : `Còn ${left} ngày`}
        </span>
        <span className="block text-[13px] text-[#6b6055]">hẹn {formatDayMonth(item.NgayHen)}</span>
      </>
    );
  }
  if (state === "Chờ tiêm") return <span className="block text-sm text-[#4a3f33]">Hẹn {formatDayMonth(item.NgayHen)}</span>;
  // Đã tiêm: tick nhỏ + ngày tiêm
  return (
    <span className="flex items-center gap-1.5 text-sm text-[#2b2118] tabular-nums">
      <Check className="h-3.5 w-3.5 shrink-0 text-[#4d6b2a]" strokeWidth={2} aria-hidden="true" />
      {formatDate(item.NgayHen)}
    </span>
  );
}

// Ma trận ngựa × loại tiêm (mặc định của /vet/vaccinations). Mỗi ô 1 lịch đại diện (getCellRepresentative).
// Bấm ô có lịch → onOpenCell(horse, type); ô trống → form Thêm lịch điền sẵn ngựa + loại.
// keyword: lọc theo tên ngựa hoặc loại; highlightHorseId (?horse=ID): vạch cam mép trái + tên đậm hơn, cuộn tới hàng; không ẩn hàng khác.
export default function VaccinationMatrix({ horses, items, keyword, highlightHorseId, today, onOpenCell }) {
  const highlightRef = useRef(null);

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightHorseId]);

  const allColumns = getVaccineColumns(items);
  const normalized = keyword.trim().toLocaleLowerCase("vi");
  // Từ khóa trùng tên loại → chỉ hiện các cột đó (mọi ngựa); không thì lọc hàng theo tên ngựa
  const matchedColumns = normalized ? allColumns.filter((type) => type.toLocaleLowerCase("vi").includes(normalized)) : [];
  const columns = matchedColumns.length > 0 ? matchedColumns : allColumns;
  const rowHorses = matchedColumns.length > 0 || !normalized ? horses : horses.filter((h) => h.Ten.toLocaleLowerCase("vi").includes(normalized));

  const rows = rowHorses
    .map((horse) => {
      const cells = columns.map((type) =>
        getCellRepresentative(items.filter((v) => v.HorseID === horse.HorseID && v.Loai === type), today)
      );
      return { horse, cells, rank: rowRank(cells.map((c) => c?.state)) };
    })
    .sort((a, b) => a.rank - b.rank || a.horse.Ten.localeCompare(b.horse.Ten, "vi"));

  const allCells = rows.flatMap((r) => r.cells);
  const summary = [
    [allCells.filter((c) => c?.state === "Quá hạn").length, "quá hạn"],
    [allCells.filter((c) => c?.state === "Sắp tới").length, "sắp tới"],
    [allCells.filter((c) => !c).length, "ô chưa có lịch"],
  ]
    .map(([n, label]) => `${n} ${label}`)
    .join(" · ");

  if (rows.length === 0 || columns.length === 0) {
    return <p className="mt-4 rounded-[4px] border border-[#d9cfba] bg-white py-12 text-center text-sm text-[#4a3f33]">Không có lịch tiêm nào khớp bộ lọc.</p>;
  }

  return (
    <>
      <p className="mt-3 text-sm text-[#4a3f33]">{summary}</p>
      <div className="mt-3 overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white caret-transparent">
        {/* table-fixed: cột Ngựa 220px, các cột vắc-xin chia đều (tối thiểu 160px mỗi cột) */}
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-sm"
          style={{ minWidth: HORSE_COLUMN_WIDTH + columns.length * MIN_COLUMN_WIDTH }}
        >
          <colgroup>
            <col style={{ width: HORSE_COLUMN_WIDTH }} />
            {columns.map((type) => (
              <col key={type} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={`${HEAD} sticky left-0 z-10 text-left`}>
                Ngựa
              </th>
              {columns.map((type) => (
                <th key={type} scope="col" className={`${HEAD} border-l border-l-[#d9cfba] text-center`}>
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>*]:border-b-0">
            {rows.map(({ horse, cells }) => {
              const highlighted = horse.HorseID === highlightHorseId;
              return (
                <tr key={horse.HorseID} ref={highlighted ? highlightRef : undefined} className="group">
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 h-16 border-b border-[#d9cfba] bg-white px-3 text-left font-normal transition-colors group-hover:bg-[#f0efec] ${
                      highlighted ? "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[#c2570c]" : ""
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <HorseAvatar horse={horse} size={36} square />
                      <span className={`truncate font-serif text-base text-[#2b2118] ${highlighted ? "font-bold" : "font-semibold"}`}>{horse.Ten}</span>
                    </span>
                  </th>
                  {cells.map((cell, index) => {
                    const type = columns[index];
                    return (
                      <td
                        key={type}
                        className="h-16 border-b border-l border-[#d9cfba] p-0 text-center transition-colors group-hover:bg-[#f0efec]"
                      >
                        {cell ? (
                          <button
                            type="button"
                            onClick={() => onOpenCell(horse, type)}
                            aria-label={`${horse.Ten} · ${type}: ${cell.state}, ngày hẹn ${formatDate(cell.item.NgayHen)}`}
                            className={`flex h-16 w-full cursor-pointer flex-col items-center justify-center border-l-[3px] px-2 outline-none ${
                              cell.state === "Quá hạn" ? "border-l-[#c0262d]" : "border-l-transparent"
                            } ${FOCUS_RING}`}
                          >
                            <CellText item={cell.item} state={cell.state} today={today} />
                          </button>
                        ) : (
                          <Link
                            to={`/vet/vaccinations/new?${new URLSearchParams({ horse: horse.HorseID, type })}`}
                            aria-label={`Hẹn ${type} cho ${horse.Ten}`}
                            className={`group/cell flex h-16 w-full items-center justify-center outline-none ${FOCUS_RING}`}
                          >
                            <span className="text-sm text-[#b9ab90] group-hover/cell:hidden group-focus-visible/cell:hidden">—</span>
                            <span className="hidden text-[13px] font-semibold text-[#c2570c] group-hover/cell:inline group-focus-visible/cell:inline">
                              + Hẹn
                            </span>
                          </Link>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <VaccinationLegend />
    </>
  );
}
