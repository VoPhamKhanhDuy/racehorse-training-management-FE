import { useState } from "react";
import { Link } from "react-router-dom";
import HorseAvatar from "../../components/HorseAvatar";
import TablePager from "../../components/TablePager";
import { formatDate } from "../../utils/date";

const PAGE_SIZE = 10;
export const TH = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
export const TD = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// Bảng "Cần xử lý" (bảng trung tính: nền trắng, viền #E3E3E3, header #F5F5F5, kẻ ô, không zebra, hover #FAFAFA, không cuộn ngang).
// Cột: STT | Ngày | Ngựa | Loại việc | Nội dung | Tình trạng (chữ #1f1f1f thường; chấm cam 6px chỉ cho sự cố "Mới" và "Quá hạn n ngày" — tone "danger") | Xử lý (link cam theo loại việc).
// items: [{ key, date, horse, kind, content, status, tone (danger | warn | undefined), action: { label, to } }] đã lọc + sắp xếp; phân trang 10 dòng. unit: đơn vị ở chân bảng.
export default function OverviewTaskTable({ items, emptyText }) {
  const [page, setPage] = useState(1);

  if (items.length === 0) {
    return <div className="rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">{emptyText}</div>;
  }

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: "48px" }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "11%" }} />
          <col />
          <col style={{ width: "16%" }} />
          <col style={{ width: "13%" }} />
        </colgroup>
        <thead>
          <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
            <th className={`${TH} text-center`}>STT</th>
            <th className={TH}>Ngày</th>
            <th className={TH}>Ngựa</th>
            <th className={TH}>Loại việc</th>
            <th className={TH}>Nội dung</th>
            <th className={TH}>Tình trạng</th>
            <th className={TH}>Xử lý</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {items.slice(offset, offset + PAGE_SIZE).map((item, index) => (
            <tr key={item.key} className="h-14 bg-white transition-colors hover:bg-[#FAFAFA]">
              <td className={`${TD} text-center text-[#6b6b6b] tabular-nums`}>{offset + index + 1}</td>
              <td className={`${TD} whitespace-nowrap tabular-nums`}>{item.date ? formatDate(item.date) : <span className="text-[#B5B5B5]">—</span>}</td>
              <td className={TD}>
                <span className="flex min-w-0 items-center gap-2.5">
                  <HorseAvatar horse={item.horse} size={32} square />
                  <span className="truncate font-semibold" title={item.horse?.Ten}>
                    {item.horse?.Ten}
                  </span>
                </span>
              </td>
              <td className={TD}>{item.kind}</td>
              <td className={TD}>
                <span className="block truncate" title={item.content}>
                  {item.content}
                </span>
                {item.otherCount > 0 && <span className="block text-xs text-[#6b6b6b]">+{item.otherCount} việc khác</span>}
              </td>
              <td className={TD}>
                <span className="flex min-w-0 items-center gap-1.5">
                  {item.tone === "danger" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2570c]" aria-hidden="true" />}
                  <span className="truncate">{item.status}</span>
                </span>
              </td>
              <td className={TD}>
                <Link to={item.action.to} className="font-semibold whitespace-nowrap text-[#c2570c] hover:underline">
                  {item.action.label}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <TablePager page={currentPage} pageCount={pageCount} total={items.length} pageSize={PAGE_SIZE} unit="việc" onPage={setPage} />
    </div>
  );
}
