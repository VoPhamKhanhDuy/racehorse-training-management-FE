import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import IncidentDetailDialog from "../../components/IncidentDetailDialog";
import IncidentTable from "../../components/IncidentTable";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import { getHorses, getIncidentsForVet, updateHealthIncidentStatus } from "../../services/careService";
import { getActiveTrainingLocks } from "../../services/vetService";
import { addAuditLog } from "../../services/auditService";
import { INCIDENT_STATUS } from "../../data/incidentOptions";
import { toUserID } from "../../utils/userId";

// Bác sĩ thú y xử lý báo cáo sự cố về sức khỏe ngựa (Vết thương, Khập khiễng, Bỏ ăn) do nhân viên chăm sóc gửi.
// API: GET/POST /api/vet/incidents. Số chuồng lấy từ SoChuong trên DTO (không gọi /groom/stables — vet bị 403).
// Bảng + modal chi tiết DÙNG CHUNG với Quản lý (components/IncidentTable.jsx, IncidentDetailDialog.jsx); trang này chỉ nạp dữ liệu sức khỏe + cập nhật trạng thái.
export default function VetIncidents() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [horses, setHorses] = useState([]);
  const [lockDates, setLockDates] = useState({}); // HorseID → ngày đặt lệnh khóa đang hiệu lực (đọc từ kho lệnh khóa của Vet)
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
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
  const selected = reports.find((r) => r.ReportID === selectedId) ?? null;

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
        <div className="mt-6">
          <IncidentTable reports={reports} horses={horses} onSelect={(report) => setSelectedId(report.ReportID)} />
        </div>
      )}

      {selected && (
        <IncidentDetailDialog
          key={selected.ReportID}
          role="veterinarian"
          userId={toUserID(user.id)}
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
