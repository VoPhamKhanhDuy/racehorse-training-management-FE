import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import HorseAvatar from "../../components/HorseAvatar";
import { daysBetween, daysSince, formatDate, formatDayMonth } from "../../utils/date";
import { getCellRepresentative, getVaccineColumns } from "../../utils/vaccinationMatrix";

// Nền ô theo trạng thái đại diện: quá hạn cam nhạt rõ, sắp tới / hôm nay be nhạt — 2 màu phải phân biệt ngay; còn lại không tô
const CELL_BG = { "Quá hạn": "bg-[#f6dcc3]", "Sắp tới": "bg-[#f3ebdd]" };
// Hàng cần chú ý trước: có quá hạn → có sắp tới → còn lại
const rowRank = (states) => (states.includes("Quá hạn") ? 0 : states.includes("Sắp tới") ? 1 : 2);

// Nội dung 2 dòng nhỏ trong ô
function CellText({ item, state, today }) {
  if (state === "Quá hạn") {
    return (
      <>
        <span className="block font-medium text-[#b45309]">Quá hạn {daysSince(item.NgayHen)} ngày</span>
        <span className="block text-xs text-stone">hẹn {formatDayMonth(item.NgayHen)}</span>
      </>
    );
  }
  if (state === "Sắp tới") {
    const left = daysBetween(today, item.NgayHen);
    return (
      <>
        <span className="block text-bark">{left === 0 ? "Hôm nay" : `Còn ${left} ngày`}</span>
        <span className="block text-xs text-stone">hẹn {formatDayMonth(item.NgayHen)}</span>
      </>
    );
  }
  if (state === "Chờ tiêm") return <span className="block text-stone">Hẹn {formatDayMonth(item.NgayHen)}</span>;
  // Đã tiêm: chỉ 1 dòng ngày tiêm, chữ mờ
  return <span className="block text-stone tabular-nums">{formatDate(item.NgayHen)}</span>;
}

// Ma trận ngựa × loại tiêm (mặc định của /vet/vaccinations). Mỗi ô 1 lịch đại diện (getCellRepresentative).
// Bấm ô có lịch → onOpenCell(horse, type); ô trống → form Thêm lịch điền sẵn ngựa + loại.
// keyword: lọc theo tên ngựa hoặc loại; highlightHorseId (?horse=ID): vạch cam 2px mép trái + tên đậm hơn, cuộn tới hàng; không tô nền, không ẩn hàng khác.
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
    return <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">Không có lịch tiêm nào khớp bộ lọc.</p>;
  }

  return (
    <>
      <p className="mt-2 text-[13px] text-stone">{summary}</p>
      <div className="mt-4 overflow-x-auto caret-transparent">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone/20">
              <th scope="col" className="sticky left-0 z-10 w-[190px] bg-parchment py-2 pl-3 text-left text-xs font-medium tracking-wide text-stone uppercase">
                Ngựa
              </th>
              {columns.map((type) => (
                <th key={type} scope="col" className="px-2 py-2 text-center text-xs font-medium tracking-wide text-stone uppercase">
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ horse, cells }) => {
              const highlighted = horse.HorseID === highlightHorseId;
              return (
                <tr key={horse.HorseID} ref={highlighted ? highlightRef : undefined} className="border-b border-stone/15">
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 bg-parchment py-2 pl-3 text-left font-normal ${
                      highlighted ? "before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-brass" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <HorseAvatar horse={horse} size={28} />
                      <span className={`font-serif text-base text-ink ${highlighted ? "font-bold" : "font-semibold"}`}>{horse.Ten}</span>
                    </span>
                  </th>
                  {cells.map((cell, index) => {
                    const type = columns[index];
                    const bg = cell ? CELL_BG[cell.state] : undefined;
                    return (
                      <td key={type} className={`h-16 p-0 text-center ${bg ?? ""}`}>
                        {cell ? (
                          <button
                            type="button"
                            onClick={() => onOpenCell(horse, type)}
                            aria-label={`${horse.Ten} · ${type}: ${cell.state}, ngày hẹn ${formatDate(cell.item.NgayHen)}`}
                            className="flex h-16 w-full cursor-pointer flex-col items-center justify-center px-2 outline-none transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brass"
                          >
                            <CellText item={cell.item} state={cell.state} today={today} />
                          </button>
                        ) : (
                          <Link
                            to={`/vet/vaccinations/new?${new URLSearchParams({ horse: horse.HorseID, type })}`}
                            aria-label={`Hẹn ${type} cho ${horse.Ten}`}
                            className="group flex h-16 w-full items-center justify-center outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brass"
                          >
                            <span className="text-stone/60 group-hover:hidden group-focus-visible:hidden">—</span>
                            <span className="hidden text-xs font-medium text-brass-deep group-hover:inline group-focus-visible:inline">+ Hẹn</span>
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
      <p className="mt-3 text-xs text-stone">Mỗi ô là lần tiêm gần nhất hoặc lịch sắp tới. Nền cam: quá hạn · nền be: sắp đến hạn · ô trống: chưa có lịch.</p>
    </>
  );
}
