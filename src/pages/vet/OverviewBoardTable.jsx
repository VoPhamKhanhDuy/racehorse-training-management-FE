import { useState } from "react";
import { Link } from "react-router-dom";
import HorseAvatar from "../../components/HorseAvatar";
import TablePager from "../../components/TablePager";
import { TD, TH } from "./OverviewTaskTable";
import { formatDate, formatDaysAgo, formatHorseAge } from "../../utils/date";
import { getHealthLabel } from "../../utils/healthStatusStyles";

const PAGE_SIZE = 10;

// Bảng "Bảng theo dõi" (cùng chuẩn bảng trung tính): STT | Ngựa (+ giống · tuổi) | Tình trạng | Khám gần nhất | Lưu ý / Vắc-xin | Thao tác.
// Ngựa "Cần chú ý" (đang điều trị / chấn thương / cách ly / cần theo dõi) có chữ tình trạng cam đậm; ngựa tốt chữ thường.
// rows: [{ horse, status, attention, latestRecord, note }] đã lọc + sắp xếp (cần chú ý trước).
export default function OverviewBoardTable({ rows, emptyText }) {
  const [page, setPage] = useState(1);

  if (rows.length === 0) {
    return <div className="rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">{emptyText}</div>;
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: "48px" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "17%" }} />
          <col />
          <col style={{ width: "13%" }} />
        </colgroup>
        <thead>
          <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
            <th className={`${TH} text-center`}>STT</th>
            <th className={TH}>Ngựa</th>
            <th className={TH}>Tình trạng</th>
            <th className={TH}>Khám gần nhất</th>
            <th className={TH}>Lưu ý / Vắc-xin</th>
            <th className={TH}>Thao tác</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {rows.slice(offset, offset + PAGE_SIZE).map(({ horse, status, attention, latestRecord, note }, index) => {
            const facts = [horse.Giong, formatHorseAge(horse.NgaySinh)].filter(Boolean).join(" · ");
            return (
              <tr key={horse.HorseID} className="h-14 bg-white transition-colors hover:bg-[#FAFAFA]">
                <td className={`${TD} text-center text-[#6b6b6b] tabular-nums`}>{offset + index + 1}</td>
                <td className={TD}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <HorseAvatar horse={horse} size={32} square />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold" title={horse.Ten}>
                        {horse.Ten}
                      </span>
                      {facts && <span className="block truncate text-xs text-[#6b6b6b]">{facts}</span>}
                    </span>
                  </span>
                </td>
                <td className={TD}>
                  <span className={attention ? "font-semibold text-[#c2570c]" : ""}>{getHealthLabel(status)}</span>
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  {latestRecord ? (
                    <>
                      <span className="block tabular-nums">{formatDate(latestRecord.Ngay)}</span>
                      <span className="block text-xs text-[#6b6b6b]">{formatDaysAgo(latestRecord.Ngay)}</span>
                    </>
                  ) : (
                    <span className="text-[#6b6b6b]">Chưa khám</span>
                  )}
                </td>
                <td className={TD}>
                  {note ? (
                    <span className="line-clamp-2" title={note}>
                      {note}
                    </span>
                  ) : (
                    <span className="text-[#B5B5B5]">—</span>
                  )}
                </td>
                <td className={TD}>
                  <Link to={`/vet/exams?horse=${horse.HorseID}`} className="font-semibold whitespace-nowrap text-[#c2570c] hover:underline">
                    Xem sổ khám
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <TablePager page={currentPage} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} unit="ngựa" onPage={setPage} />
    </div>
  );
}
