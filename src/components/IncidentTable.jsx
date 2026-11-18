import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import IncidentRow from "./IncidentRow";
import TablePager from "./TablePager";
import { INCIDENT_STATUS, INCIDENT_STATUSES } from "../data/incidentOptions";

const PAGE_SIZE = 10;
const HEAD = "border-r border-[#dfd6c5] px-4 text-[13px] font-semibold text-[#2b2118] last:border-r-0";
const FIELD =
  "h-10 w-full cursor-pointer appearance-none rounded-[4px] border border-[#cfc4ad] bg-white pr-9 pl-3.5 text-sm text-[#2b2118] outline-none transition-colors focus:border-[#c2570c]";

// Bảng sự cố DÙNG CHUNG cho Bác sĩ thú y (/vet/incidents) và Quản lý (/manager/incidents):
// Khung thống kê nhanh + hàng lọc (tìm tên ngựa + Trạng thái + Loại sự cố) + bảng 7 cột.
export default function IncidentTable({ reports, horses = [], onSelect }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const normalizedKeyword = keyword.trim().toLowerCase();
  // Mới → Đang xử lý → Đã xử lý; trong mỗi nhóm giữ thứ tự mới nhất trước (sort ổn định)
  const statusRank = (r) => INCIDENT_STATUSES.indexOf(r.TrangThai);
  const visible = reports
    .filter(
      (r) =>
        (!statusFilter || r.TrangThai === statusFilter) &&
        (!typeFilter || r.LoaiSuCo === typeFilter) &&
        r.HorseName.toLowerCase().includes(normalizedKeyword)
    )
    .sort((a, b) => statusRank(a) - statusRank(b));
  const types = [...new Set(reports.map((r) => r.LoaiSuCo).filter(Boolean))];

  const newCount = reports.filter((r) => r.TrangThai === INCIDENT_STATUS.NEW).length;
  const inProgressCount = reports.filter((r) => r.TrangThai === INCIDENT_STATUS.IN_PROGRESS).length;
  const doneCount = reports.filter((r) => r.TrangThai === INCIDENT_STATUS.DONE).length;

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageRows = visible.slice(offset, offset + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 divide-x divide-y divide-[#d4c8b0] rounded-[6px] border border-[#b9ab90] bg-white shadow-xs sm:grid-cols-4 sm:divide-y-0">
        <div className="px-4 py-3.5 sm:px-5">
          <dt className="text-xs font-medium text-[#6b6055]">Tổng báo cáo</dt>
          <dd className="mt-1 font-serif text-2xl leading-none font-semibold text-[#2b2118] tabular-nums">{reports.length}</dd>
        </div>
        <div className="px-4 py-3.5 sm:px-5">
          <dt className="text-xs font-medium text-[#6b6055]">Chờ tiếp nhận (Mới)</dt>
          <dd className={`mt-1 font-serif text-2xl leading-none font-semibold tabular-nums ${newCount > 0 ? "text-[#c0262d]" : "text-[#2b2118]"}`}>
            {newCount}
          </dd>
        </div>
        <div className="px-4 py-3.5 sm:px-5">
          <dt className="text-xs font-medium text-[#6b6055]">Đang xử lý</dt>
          <dd className={`mt-1 font-serif text-2xl leading-none font-semibold tabular-nums ${inProgressCount > 0 ? "text-[#c2570c]" : "text-[#2b2118]"}`}>
            {inProgressCount}
          </dd>
        </div>
        <div className="px-4 py-3.5 sm:px-5">
          <dt className="text-xs font-medium text-[#6b6055]">Đã hoàn tất</dt>
          <dd className="mt-1 font-serif text-2xl leading-none font-semibold text-[#4d6b2a] tabular-nums">{doneCount}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <label htmlFor="incidentKeyword" className="sr-only">
            Tìm theo tên ngựa
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" aria-hidden="true" />
          <input
            id="incidentKeyword"
            type="search"
            placeholder="Tìm theo tên ngựa..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-[4px] border border-[#cfc4ad] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none transition-colors placeholder:text-[#6b6055]/70 focus:border-[#c2570c]"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <label htmlFor="incidentStatus" className="sr-only">
            Trạng thái
          </label>
          <select
            id="incidentStatus"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={FIELD}
          >
            <option value="">Tất cả trạng thái</option>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s} ({reports.filter((r) => r.TrangThai === s).length})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
        </div>
        <div className="relative w-full sm:w-52">
          <label htmlFor="incidentType" className="sr-only">
            Loại sự cố
          </label>
          <select
            id="incidentType"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className={FIELD}
          >
            <option value="">Tất cả loại sự cố</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type} ({reports.filter((r) => r.LoaiSuCo === type).length})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-[6px] border border-[#cfc4ad] bg-white py-12 text-center text-sm text-[#6b6055]">
          {reports.length === 0 ? "Chưa có báo cáo sự cố nào." : "Không có sự cố nào khớp bộ lọc."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-[6px] border border-[#cfc4ad] bg-white shadow-xs">
          {/* table-layout: fixed + colgroup; tiêu đề và hàng dùng chung một lưới cột, không cuộn ngang */}
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col style={{ width: "52px" }} />
              <col style={{ width: "116px" }} />
              <col style={{ width: "21%" }} />
              <col style={{ width: "14%" }} />
              <col />
              <col style={{ width: "15%" }} />
              <col style={{ width: "130px" }} />
            </colgroup>
            <thead>
              <tr className="h-11 border-b border-[#dfd6c5] bg-[#f7f3eb]">
                <th className={`${HEAD} text-center`}>STT</th>
                <th className={HEAD}>Ngày báo</th>
                <th className={HEAD}>Ngựa</th>
                <th className={HEAD}>Loại sự cố</th>
                <th className={HEAD}>Mô tả</th>
                <th className={HEAD}>Người báo</th>
                <th className={HEAD}>Trạng thái</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {pageRows.map((r, i) => (
                <IncidentRow key={r.ReportID} index={offset + i + 1} report={r} horse={horseById[r.HorseID]} stable={r.SoChuong} onSelect={onSelect} />
              ))}
            </tbody>
          </table>
          <TablePager page={currentPage} pageCount={pageCount} total={visible.length} pageSize={PAGE_SIZE} unit="báo cáo" onPage={setPage} />
        </div>
      )}
    </div>
  );
}
