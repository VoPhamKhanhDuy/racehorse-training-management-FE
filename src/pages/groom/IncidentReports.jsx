import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import IncidentDetailDrawer from "./IncidentDetailDrawer";
import IncidentReportRow, { INCIDENT_GRID } from "./IncidentReportRow";
import { getHorses, getIncidentReports, getStableNumbers } from "../../services/careService";
import { toUserID } from "../../utils/userId";

const HEAD_CELL = "text-xs font-medium tracking-wide text-stone uppercase";

// Lịch sử báo cáo sự cố (INCIDENTREPORT) do chính nhân viên đăng nhập gửi: nhóm theo tháng, mới nhất trước, chỉ xem;
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

  // Nhóm theo tháng "YYYY-MM" (reports đã sắp mới → cũ nên nhóm cũng mới → cũ)
  const groups = reports.reduce((acc, report) => {
    const key = report.Ngay.slice(0, 7);
    const last = acc[acc.length - 1];
    if (last?.key === key) last.reports.push(report);
    else acc.push({ key, reports: [report] });
    return acc;
  }, []);

  const selected = reports.find((r) => r.ReportID === selectedId);

  return (
    <div className="max-w-[900px]">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Báo cáo sự cố</h1>
        <Link
          to="/groom/incidents/new"
          className="btn-primary ml-auto"
        >
          + Gửi báo cáo
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : reports.length === 0 ? (
        <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">Bạn chưa gửi báo cáo sự cố nào.</p>
      ) : (
        <>
          <p className="mt-1 text-[13px] text-stone">{reports.length} báo cáo đã gửi</p>
          <div className="mt-5">
            <div aria-hidden="true" className={`border-b border-stone/20 pr-2 pb-2 pl-3 ${INCIDENT_GRID}`}>
              <span className={HEAD_CELL}>Ngày</span>
              <span className={HEAD_CELL}>Ngựa</span>
              <span className={HEAD_CELL}>Sự cố</span>
            </div>
            {groups.map((group) => {
              const [year, month] = group.key.split("-");
              return (
                <section key={group.key} aria-label={`Tháng ${Number(month)}/${year}`}>
                  <h2 className="border-b border-stone/15 pt-5 pb-1.5 pl-3 text-xs font-medium tracking-wide text-stone uppercase select-none">
                    Tháng {Number(month)}/{year}
                  </h2>
                  <ul>
                    {group.reports.map((report) => (
                      <IncidentReportRow
                        key={report.ReportID}
                        report={report}
                        horse={horseById[report.HorseID]}
                        stable={stables[report.HorseID]}
                        selected={report.ReportID === selectedId}
                        onSelect={(r) => setSelectedId(r.ReportID)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
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
