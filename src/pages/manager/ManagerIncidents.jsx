import { useCallback, useEffect, useState } from "react";
import IncidentDetailDialog from "../../components/IncidentDetailDialog";
import IncidentTable from "../../components/IncidentTable";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import { getAllIncidentReports, updateIncidentStatus } from "../../services/careService";
import { getHorses } from "../../services/horseService";
import { addAuditLog } from "../../services/auditService";
import { INCIDENT_STATUS } from "../../data/incidentOptions";
import { toUserID } from "../../utils/userId";

// Quản lý xem mọi báo cáo và xử lý sự cố chuồng hoặc thiết bị.
export default function ManagerIncidents() {
  const { user } = useAuth();
  const managerId = user.apiUserId ?? toUserID(user.id);
  const [reports, setReports] = useState([]);
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let ignore = false;
    // Ảnh ngựa: phụ trợ — lỗi thì vẫn hiện bảng
    Promise.all([getAllIncidentReports(), getHorses().catch(() => [])])
      .then(([list, horseList]) => {
        if (ignore) return;
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

  const closeToast = useCallback(() => setToast(null), []);
  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const selected = reports.find((r) => r.ReportID === selectedId) ?? null;

  // Lưu trạng thái + ghi nhật ký; cập nhật danh sách, đóng khung và báo toast (lỗi ném lại cho khung hiện)
  const handleUpdate = async (report, changes) => {
    const updated = await updateIncidentStatus(report, changes);
    addAuditLog({
      UserID: managerId,
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
      HandledBy: updated.HandledBy ?? managerId,
      SoChuong: updated.SoChuong || report.SoChuong,
    };
    setReports((prev) => prev.map((r) => (r.ReportID === merged.ReportID ? merged : r)));
    setSelectedId(null);
    setToast({ text: updated.TrangThai === INCIDENT_STATUS.DONE ? "Đã đánh dấu đã xử lý" : "Đã nhận xử lý sự cố" });
  };

  return (
    <div className="w-full">
      <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Sự cố</h1>
      <p className="mt-1 text-sm text-[#4a3f33]">Mọi báo cáo sự cố từ nhân viên chăm sóc.</p>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-[#c0262d] bg-[#c0262d]/5 px-4 py-3 text-sm text-[#c0262d]">{loadError}</p>
      ) : (
        <div className="mt-6">
          <IncidentTable reports={reports} horses={horses} onSelect={(report) => setSelectedId(report.ReportID)} />
        </div>
      )}

      {selected && (
        <IncidentDetailDialog
          key={selected.ReportID}
          role="club_manager"
          userId={managerId}
          report={selected}
          horse={horseById[selected.HorseID]}
          stable={selected.SoChuong}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
