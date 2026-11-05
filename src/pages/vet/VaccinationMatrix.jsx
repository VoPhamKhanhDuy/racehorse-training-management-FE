import { useState } from "react";
import HorseAvatar from "../../components/HorseAvatar";
import TablePager from "../../components/TablePager";
import { daysBetween, daysSince, formatDate } from "../../utils/date";

const PAGE_SIZE = 10;
const HORSE_COLUMN_WIDTH = 220;
const TH = "border-r border-[#E3E3E3] px-3 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const CELL = "border-r border-b border-[#E3E3E3] p-0 last:border-r-0";

// Nội dung ô (chữ, không icon, không nền): luôn 1–2 dòng, căn giữa
// - Quá hạn: "Quá hạn N ngày" cam đậm + chấm cam, dòng dưới xám "hẹn dd/MM/yyyy"
// - Sắp đến hạn: "Còn N ngày" #1f1f1f đậm + "hẹn dd/MM/yyyy" xám
// - Chờ tiêm xa: "Hẹn dd/MM/yyyy" xám;  Đã tiêm: ngày tiêm gần nhất #1f1f1f;  chưa có lịch: "Chưa có lịch" xám nhạt
function CellText({ cell, today }) {
  if (!cell) return <span className="text-sm text-[#8a8a8a]">Chưa có lịch</span>;
  const { item, state } = cell;
  if (state === "Quá hạn") {
    return (
      <>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#c2570c]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2570c]" aria-hidden="true" />
          Quá hạn {daysSince(item.NgayHen)} ngày
        </span>
        <span className="block text-xs text-[#6b6b6b]">hẹn {formatDate(item.NgayHen)}</span>
      </>
    );
  }
  if (state === "Sắp tới") {
    const left = daysBetween(today, item.NgayHen);
    return (
      <>
        <span className="block text-sm font-semibold text-[#1f1f1f]">{left <= 0 ? "Hôm nay" : `Còn ${left} ngày`}</span>
        <span className="block text-xs text-[#6b6b6b]">hẹn {formatDate(item.NgayHen)}</span>
      </>
    );
  }
  if (state === "Chờ tiêm") return <span className="block text-sm text-[#6b6b6b]">Hẹn {formatDate(item.NgayHen)}</span>;
  return <span className="block text-sm text-[#1f1f1f] tabular-nums">{formatDate(item.NgayHen)}</span>;
}

// Ma trận ngựa × loại tiêm (bảng trung tính: khung trắng viền #E3E3E3 bo 4px, header #F5F5F5, kẻ ô, hover ô #FAFAFA, table-layout fixed).
// rows: [{ horse, cells: [{ item, state } | null] }] đã lọc + sắp xếp; columns: tên loại. Cả ô là vùng bấm → onOpenCell(horse, type, cell).
// Phân trang 10 ngựa/trang.
export default function VaccinationMatrix({ rows, columns, today, onOpenCell }) {
  const [page, setPage] = useState(1);

  if (rows.length === 0 || columns.length === 0) {
    return <p className="mt-4 rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">Không có lịch tiêm nào khớp bộ lọc.</p>;
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;

  return (
    <>
      <div className="mt-4 overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white caret-transparent">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: HORSE_COLUMN_WIDTH }} />
            {columns.map((type) => (
              <col key={type} />
            ))}
          </colgroup>
          <thead>
            <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
              <th scope="col" className={`${TH} text-left`}>
                Ngựa
              </th>
              {columns.map((type) => (
                <th key={type} scope="col" className={`${TH} text-center`} title={type}>
                  <span className="block truncate">{type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>*]:border-b-0">
            {rows.slice(offset, offset + PAGE_SIZE).map(({ horse, cells }) => {
              return (
                <tr key={horse.HorseID} className="h-14 bg-white">
                  <th scope="row" className="h-14 border-r border-b border-[#E3E3E3] px-3 text-left font-normal">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <HorseAvatar horse={horse} size={32} square />
                      <span className="truncate font-semibold text-[#1f1f1f]" title={horse.Ten}>
                        {horse.Ten}
                      </span>
                    </span>
                  </th>
                  {cells.map((cell, index) => {
                    const type = columns[index];
                    return (
                      <td key={type} className={CELL}>
                        <button
                          type="button"
                          onClick={() => onOpenCell(horse, type, cell)}
                          aria-label={`${horse.Ten} · ${type}: ${cell ? `${cell.state}, ngày hẹn ${formatDate(cell.item.NgayHen)}` : "chưa có lịch"}`}
                          className="flex h-14 w-full cursor-pointer flex-col items-center justify-center px-2 text-center outline-none transition-colors hover:bg-[#FAFAFA] focus-visible:bg-[#FAFAFA] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2570c]"
                        >
                          <CellText cell={cell} today={today} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <TablePager page={currentPage} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} unit="ngựa" onPage={setPage} />
      </div>
      <p className="mt-2 text-xs text-[#6b6b6b]">Ngày hiển thị là lần tiêm gần nhất. Chấm cam: quá hạn, cần tiêm.</p>
    </>
  );
}
