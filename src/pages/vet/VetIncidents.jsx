import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import TablePager from "../../components/TablePager";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import VetIncidentDialog from "./VetIncidentDialog";
import VetIncidentRow from "./VetIncidentRow";
import { getHorses, getIncidentsForVet, updateHealthIncidentStatus } from "../../services/careService";
import { getActiveTrainingLocks } from "../../services/vetService";
import { addAuditLog } from "../../services/auditService";
import { INCIDENT_STATUS, INCIDENT_STATUSES } from "../../data/incidentOptions";
import { toUserID } from "../../utils/userId";

const PAGE_SIZE = 10;
// Header bảng trung tính: nền #F5F5F5, chữ #1f1f1f weight 600, kẻ ô dọc #E3E3E3 (ô cuối không kẻ)
const HEAD = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const FIELD =
  "h-10 w-full cursor-pointer appearance-none rounded-[4px] border border-[#E3E3E3] bg-white pr-9 pl-3.5 text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]";

// Bác sĩ thú y xử lý báo cáo sự cố về sức khỏe ngựa (Vết thương, Khập khiễng, Bỏ ăn) do nhân viên chăm sóc gửi.
// API: GET/POST /api/vet/incidents. Số chuồng lấy từ SoChuong trên DTO (không gọi /groom/stables — vet bị 403).
// Bảng: STT | Ngày báo | Ngựa | Loại sự cố | Mô tả | Người báo | Trạng thái; lọc: tìm tên ngựa + dropdown Trạng thái + dropdown Loại sự cố.
// Bấm hàng → modal chi tiết (VetIncidentDialog) để tiếp nhận / hoàn tất.
export default function VetIncidents() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [horses, setHorses] = useState([]);
  const [lockDates, setLockDates] = useState({}); // HorseID → ngày đặt lệnh khóa đang hiệu lực (đọc từ kho lệnh khóa của Vet)
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  // ?report=<ReportID> (từ "Xử lý" ở Tổng quan sức khỏe) → mở thẳng modal chi tiết của sự cố đó
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(() => Number(searchParams.get("report")) || null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let ignore = false;
    // Lệnh khóa: phụ trợ — lỗi thì bỏ qua (API incidents vẫn hiện)
    const locksPromise = getActiveTrainingLocks().catch(() => []);
    Promise.all([getIncidentsForVet(), getHorses(), locksPromise])
      .then(([list, horseList, lockList]) => {
        if (ignore) return;
        setLockDates(Object.fromEntries(lockList.map((l) => [l.HorseID, l.NgayDat])));
        setReports(list);
        setHorses(horseList);
        setLoadError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err.message || "Không tải được danh sách sự cố.");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("report")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeToast = useCallback(() => setToast(null), []);
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
  const selected = reports.find((r) => r.ReportID === selectedId) ?? null;

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageRows = visible.slice(offset, offset + PAGE_SIZE);

  // Lưu trạng thái + ghi nhật ký; cập nhật danh sách, đóng khung và báo toast (lỗi ném lại cho khung hiện)
  const handleUpdate = async (report, changes) => {
    const vetId = toUserID(user.id);
    const updated = await updateHealthIncidentStatus(report.ReportID, changes);
    addAuditLog({
      UserID: vetId,
      HanhDong: updated.TrangThai === INCIDENT_STATUS.DONE ? "Đánh dấu đã xử lý sự cố" : "Nhận xử lý sự cố",
      TargetTable: "INCIDENTREPORT",
      TargetID: updated.ReportID,
      targetLabel: report.HorseName || updated.HorseName,
    });
    const merged = {
      ...report,
      ...updated,
      HorseName: updated.HorseName || report.HorseName,
      ReporterName: updated.ReporterName || report.ReporterName,
      HandlerName: updated.HandlerName || user.fullName,
      SoChuong: updated.SoChuong || report.SoChuong,
    };
    setReports((prev) => prev.map((r) => (r.ReportID === merged.ReportID ? merged : r)));
    setSelectedId(null);
    setToast({ text: updated.TrangThai === INCIDENT_STATUS.DONE ? "Đã đánh dấu đã xử lý" : "Đã nhận xử lý sự cố" });
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Sự cố cần xử lý</h1>
      <p className="mt-1 text-sm text-[#4a3f33]">Báo cáo về sức khỏe ngựa từ nhân viên chăm sóc.</p>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-[#c0262d] bg-[#c0262d]/5 px-4 py-3 text-sm text-[#c0262d]">{loadError}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Một hàng: ô tìm tên ngựa + dropdown Trạng thái + dropdown Loại sự cố */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <label htmlFor="vetIncidentKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
              <input
                id="vetIncidentKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-[4px] border border-[#E3E3E3] bg-white pr-3 pl-9 text-sm text-[#1f1f1f] outline-none transition-colors placeholder:text-[#6b6b6b]/70 focus:border-[#c2570c]"
              />
            </div>
            <div className="relative w-full sm:w-52">
              <label htmlFor="vetIncidentStatus" className="sr-only">
                Trạng thái
              </label>
              <select
                id="vetIncidentStatus"
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
              <label htmlFor="vetIncidentType" className="sr-only">
                Loại sự cố
              </label>
              <select
                id="vetIncidentType"
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
            <p className="rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">
              {reports.length === 0 ? "Chưa có báo cáo sự cố nào." : "Không có sự cố nào khớp bộ lọc."}
            </p>
          ) : (
            <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
              {/* table-layout: fixed + colgroup; tiêu đề và hàng dùng chung một lưới cột, không cuộn ngang */}
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style={{ width: "48px" }} />
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "14%" }} />
                  <col />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "13%" }} />
                </colgroup>
                <thead>
                  <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
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
                    <VetIncidentRow
                      key={r.ReportID}
                      index={offset + i + 1}
                      report={r}
                      horse={horseById[r.HorseID]}
                      stable={r.SoChuong}
                      onSelect={(report) => setSelectedId(report.ReportID)}
                    />
                  ))}
                </tbody>
              </table>
              <TablePager page={currentPage} pageCount={pageCount} total={visible.length} pageSize={PAGE_SIZE} unit="báo cáo" onPage={setPage} />
            </div>
          )}
        </div>
      )}

      {selected && (
        <VetIncidentDialog
          key={selected.ReportID}
          report={selected}
          horse={horseById[selected.HorseID]}
          stable={selected.SoChuong}
          lockedSince={lockDates[selected.HorseID]}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
