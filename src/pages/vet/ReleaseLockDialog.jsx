import { useState } from "react";
import Modal from "../../components/Modal";
import ChoiceChips from "./ChoiceChips";
import { RELEASE_HEALTH_STATES } from "../../data/medicalRecordOptions";

// Hộp xác nhận gỡ lệnh khóa: bắt buộc chọn tình trạng sức khỏe mới ("Cần theo dõi" | "Tốt"), không chọn sẵn,
// nút xác nhận bị vô hiệu cho tới khi chọn. Cùng kiểu nút với ConfirmDialog.
export default function ReleaseLockDialog({ horseName, loading, onConfirm, onCancel }) {
  const [status, setStatus] = useState("");
  const handleClose = () => {
    if (!loading) onCancel();
  };

  return (
    <Modal open title={`Gỡ lệnh khóa của ${horseName}?`} onClose={handleClose} size="sm">
      <p className="text-[#6E6E76]">Sau khi gỡ, ngựa có thể được xếp lịch tập trở lại.</p>
      <div className="mt-5">
        <ChoiceChips
          legend="Tình trạng sức khỏe mới"
          name="releaseStatus"
          options={RELEASE_HEALTH_STATES}
          value={status}
          hint="Tình trạng sức khỏe do bác sĩ quyết định."
          onChange={setStatus}
        />
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 font-semibold transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={() => onConfirm(status)}
          disabled={!status || loading}
          className="cursor-pointer rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Gỡ khóa"}
        </button>
      </div>
    </Modal>
  );
}
