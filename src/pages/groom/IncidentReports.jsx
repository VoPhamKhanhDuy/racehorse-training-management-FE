import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import TablePager from "../../components/TablePager";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import IncidentDetailDrawer from "./IncidentDetailDrawer";
import IncidentReportRow from "./IncidentReportRow";
import { getHorses, getIncidentReports, getStableNumbers } from "../../services/careService";
import { toUserID } from "../../utils/userId";

// Header bảng trung tính: nền #F5F5F5, chữ #1f1f1f weight 600 13px, kẻ ô dọc #E3E3E3 (ô cuối không kẻ)
const HEAD = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const PAGE_SIZE = 10;
const FIELD =
  "h-10 w-full rounded-[4px] border border-[#E3E3E3] bg-white text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]";
const PRIMARY_LINK =
  "inline-flex h-10 items-center rounded-[4px] bg-[#c2570c] px-5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#a8480a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

// Lịch sử báo cáo sự cố (INCIDENTREPORT) do chính nhân viên đăng nhập gửi: mới nhất trước, chỉ xem;
// bấm 1 hàng mở ngăn chi tiết bên phải (mô tả đầy đủ + ảnh lớn).
// Form gửi toast sang qua location.state ("Đã gửi báo cáo sự cố").
export default function IncidentReports() {
  const { user } = useAuth();
  const groomId = toUserID(user.id);
  const location = useLocation();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [horses, setHorses] = useState([]);
  const [stables, setStables] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "" = Tất cả loại
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null); // ReportID đang mở trong ngăn chi tiết
  const [toast, setToast] = useState(location.state?.toast ?? null);

  // Đọc xong thông báo từ form thì xóa khỏi history để Back/F5 không hiện lại
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getIncidentReports(groomId), getHorses(), getStableNumbers()])
      .then(([reportList, horseList, stableMap]) => {
        if (ignore) return;
        setReports(reportList);
        setHorses(horseList);
        setStables(stableMap);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err.message || "Không tải được báo cáo.");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [groomId]);

  const closeToast = useCallback(() => setToast(null), []);
  const closeDrawer = useCallback(() => setSelectedId(null), []);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));

  const selected = reports.find((r) => r.ReportID === selectedId);

  // Bộ lọc: tìm theo tên ngựa hoặc mô tả + loại sự cố (lấy từ các báo cáo đã gửi, kèm số lượng)
  const types = [...new Set(reports.map((r) => r.LoaiSuCo).filter(Boolean))];
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");
  const filtered = reports.filter(
    (r) =>
      (!typeFilter || r.LoaiSuCo === typeFilter) &&
      (!normalizedKeyword ||
        (horseById[r.HorseID]?.Ten ?? "").toLocaleLowerCase("vi").includes(normalizedKeyword) ||
        (r.MoTa ?? "").toLocaleLowerCase("vi").includes(normalizedKeyword))
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Báo cáo sự cố</h1>
          {!loading && reports.length > 0 && <p className="mt-1 text-sm text-[#4a3f33]">{reports.length} báo cáo đã gửi</p>}
        </div>
        <Link to="/groom/incidents/new" className={PRIMARY_LINK}>
          Gửi báo cáo
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : reports.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-[#E3E3E3] bg-white px-4 py-12 text-center">
          <p className="text-sm text-[#4a3f33]">Bạn chưa gửi báo cáo sự cố nào.</p>
          <Link to="/groom/incidents/new" className={`mt-4 ${PRIMARY_LINK}`}>
            Gửi báo cáo
          </Link>
        </div>
      ) : (
        <>
        {/* Một hàng: ô tìm kiếm + dropdown Loại sự cố */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <label htmlFor="incidentKeyword" className="sr-only">
              Tìm theo tên ngựa hoặc mô tả
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
            <input
              id="incidentKeyword"
              type="search"
              placeholder="Tìm theo tên ngựa hoặc mô tả"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className={`${FIELD} pr-3 pl-9 placeholder:text-[#6b6b6b]/70`}
            />
          </div>
          <div className="relative w-full sm:w-56">
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
              className={`${FIELD} cursor-pointer appearance-none pr-9 pl-3.5`}
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

        {filtered.length === 0 ? (
          <p className="mt-4 rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">Không tìm thấy báo cáo nào.</p>
        ) : (
        <div className="mt-4 overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
          {/* table-layout: fixed, tổng 100%, không cuộn ngang; tiêu đề và hàng dùng chung một lưới cột */}
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "40%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
                <th className={HEAD}>Ngựa</th>
                <th className={HEAD}>Loại sự cố</th>
                <th className={HEAD}>Mô tả</th>
                <th className={`${HEAD} text-right`}>Ngày báo</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {pageRows.map((report) => (
                <IncidentReportRow
                  key={report.ReportID}
                  report={report}
                  horse={horseById[report.HorseID]}
                  stable={stables[report.HorseID]}
                  selected={report.ReportID === selectedId}
                  onSelect={(r) => setSelectedId(r.ReportID)}
                />
              ))}
            </tbody>
          </table>
          <TablePager page={currentPage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} unit="báo cáo" onPage={setPage} />
        </div>
        )}
        </>
      )}

      <IncidentDetailDrawer
        report={selected}
        horse={selected && horseById[selected.HorseID]}
        stable={selected && stables[selected.HorseID]}
        onClose={closeDrawer}
      />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
