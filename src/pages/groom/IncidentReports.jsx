import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import IncidentDetailDrawer from "./IncidentDetailDrawer";
import IncidentReportRow from "./IncidentReportRow";
import { getHorses, getIncidentReports, getStableNumbers } from "../../services/careService";
import { toUserID } from "../../utils/userId";

const HEAD = "border-b border-[#b9ab90] bg-[#4a3a2a] px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-[#f3ede0]";
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

  return (
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Báo cáo sự cố</h1>
          {!loading && reports.length > 0 && <p className="mt-1 text-sm text-[#4a3f33]">{reports.length} báo cáo đã gửi</p>}
        </div>
        <Link to="/groom/incidents/new" className={PRIMARY_LINK}>
          + Gửi báo cáo
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : reports.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-[#d9cfba] bg-white px-4 py-12 text-center">
          <p className="text-sm text-[#4a3f33]">Bạn chưa gửi báo cáo sự cố nào.</p>
          <Link to="/groom/incidents/new" className={`mt-4 ${PRIMARY_LINK}`}>
            + Gửi báo cáo
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className={HEAD}>Ngựa</th>
                <th className={HEAD}>Loại sự cố</th>
                <th className={HEAD}>Mô tả</th>
                <th className={`${HEAD} w-[130px] min-w-[130px] max-w-[130px] text-right`}>Ngày báo</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {reports.map((report) => (
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
          <p className="border-t border-[#d9cfba] px-4 py-3 text-sm text-[#4a3f33] tabular-nums">
            Hiển thị {reports.length} / {reports.length} báo cáo
          </p>
        </div>
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
