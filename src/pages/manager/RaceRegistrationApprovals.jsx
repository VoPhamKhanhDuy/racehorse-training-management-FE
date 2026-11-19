import { useCallback, useState } from "react";
import RaceRegistrationBoard from "../../components/RaceRegistrationBoard";
import Toast from "../../components/Toast";
import { addAuditLog } from "../../services/auditService";
import CancelRaceDialog from "./CancelRaceDialog";
import CreateRaceDialog from "./CreateRaceDialog";
import ManagerRaceTable from "./ManagerRaceTable";

// Quản lý CLB > Đăng ký thi đấu: bước duyệt cuối, sau khi chủ ngựa đã đồng ý. Bấm "Xem" để Duyệt / Từ chối (lý do bắt buộc).
// Khối "Tình trạng ngựa" trong khung chi tiết cảnh báo khi ngựa đang khóa tập / chưa đủ điều kiện nhưng không chặn việc duyệt.
// "Tạo giải" mở CreateRaceDialog; tab "Giải đua" (ManagerRaceTable) liệt kê mọi giải, có "Hủy giải" (CancelRaceDialog) và tải lại
// (đổi key) sau khi tạo / hủy để thay đổi hiện ngay. Hủy giải được ghi nhật ký thao tác.
// API — services/raceRegistrationApi.js (duyệt) và services/raceService.js (tạo / hủy giải).
export default function RaceRegistrationApprovals() {
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [racesVersion, setRacesVersion] = useState(0);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  return (
    <>
      <RaceRegistrationBoard
        title="Đăng ký thi đấu"
        description="Duyệt cuối các đăng ký thi đấu đã được chủ ngựa đồng ý."
        headerAction={
          <button type="button" onClick={() => setCreating(true)} className="btn-primary">
            Tạo giải
          </button>
        }
        extraTab={{ code: "races", label: "Giải đua", content: <ManagerRaceTable key={racesVersion} onCancel={setCancelling} /> }}
      />
      {cancelling && (
        <CancelRaceDialog
          race={cancelling}
          onClose={() => setCancelling(null)}
          onCancelled={(race) => {
            addAuditLog({
              HanhDong: `Hủy giải ${race.TenGiai || cancelling.TenGiai}`,
              TargetTable: "RACEREGISTRATION",
              TargetID: race.RaceID,
              targetLabel: race.TenGiai || cancelling.TenGiai,
            });
            setCancelling(null);
            setRacesVersion((v) => v + 1);
            setToast({ text: `Đã hủy giải "${race.TenGiai || cancelling.TenGiai}"` });
          }}
        />
      )}
      {creating && (
        <CreateRaceDialog
          onClose={() => setCreating(false)}
          onCreated={(race) => {
            setCreating(false);
            setRacesVersion((v) => v + 1);
            setToast({ text: `Đã tạo giải "${race.TenGiai}"` });
          }}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
