import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RaceRegistrationBoard from "../../components/RaceRegistrationBoard";
import { syncPendingRegistrations } from "../../services/raceRegistrationMock";
import Toast from "../../components/Toast";
import OpenRaceTable from "./OpenRaceTable";
import RaceRegistrationCreateDialog from "./RaceRegistrationCreateDialog";

// Trainer > Đăng ký thi đấu (luồng duyệt Trainer → Chủ ngựa → Quản lý, MOCK — services/raceRegistrationMock.js).
// Bảng + khung chi tiết nằm trong RaceRegistrationBoard (dùng chung các vai trò); ở đây thêm nút "Tạo đăng ký".
// Ma trận ngựa × giải và nhập kết quả thi đấu vẫn ở trang "Kết quả thi đấu" (/trainer/races).
export default function RaceRegistrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ?race=<RaceID>: mở sẵn khung Tạo đăng ký với giải đã chọn (từ nút "Đăng ký ngựa" ở Thông tin giải)
  const raceParam = searchParams.get("race");
  const [creating, setCreating] = useState(Boolean(raceParam));
  const [createRaceId, setCreateRaceId] = useState(raceParam ? Number(raceParam) : null);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  // Dọn tham số ?race khỏi URL sau khi đã dùng
  useEffect(() => {
    if (raceParam) setSearchParams({}, { replace: true });
  }, [raceParam, setSearchParams]);

  const openCreate = (raceId = null) => {
    setCreateRaceId(raceId);
    setCreating(true);
  };

  // Mở trang = đồng bộ các đăng ký đã duyệt mà chưa tạo được đăng ký thật (xem syncPendingRegistrations trong raceRegistrationMock.js)
  useEffect(() => {
    syncPendingRegistrations()
      .then(({ synced }) => {
        if (synced > 0) setToast({ text: `Đã đồng bộ ${synced} đăng ký` });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <RaceRegistrationBoard
        title="Đăng ký thi đấu"
        description="Tạo đăng ký cho ngựa, gửi chủ ngựa đồng ý rồi quản lý duyệt."
        headerAction={
          <button type="button" onClick={() => openCreate()} className="btn-primary">
            Tạo đăng ký
          </button>
        }
        extraTab={{ code: "open", label: "Giải đang mở", content: <OpenRaceTable onRegister={openCreate} /> }}
      />
      {creating && (
        <RaceRegistrationCreateDialog
          initialRaceId={createRaceId}
          onClose={() => setCreating(false)}
          onCreated={(text) => {
            setCreating(false);
            setToast({ text });
          }}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
