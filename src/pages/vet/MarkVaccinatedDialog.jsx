import { useState } from "react";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import { addDays, todayISO } from "../../utils/date";

// Hộp xác nhận đã tiêm. "Hẹn lần tiếp theo" tùy chọn (để trống được; phải sau hôm nay) — có nhập thì tạo thêm lịch chờ tiêm.
// Không có trường ngày tiêm thực tế (ERD không có). Cùng kiểu nút với ConfirmDialog.
export default function MarkVaccinatedDialog({ item, horseName, loading, error, onConfirm, onCancel }) {
  const [nextDate, setNextDate] = useState("");
  const [dateError, setDateError] = useState("");
  const minNext = addDays(todayISO(), 1);

  const handleClose = () => {
    if (!loading) onCancel();
  };

  const handleConfirm = () => {
    if (nextDate && nextDate < minNext) {
      setDateError("Ngày hẹn lần tiếp theo phải sau hôm nay.");
      return;
    }
    onConfirm(nextDate || null);
  };

  return (
    <Modal open title={`Xác nhận đã tiêm ${item.Loai} cho ${horseName}?`} onClose={handleClose} size="sm">
      <div className="space-y-2">
        <FormField
          variant="line"
          label="Hẹn lần tiếp theo (không bắt buộc)"
          id="nextVaccineDate"
          type="date"
          min={minNext}
          value={nextDate}
          onChange={(e) => {
            setNextDate(e.target.value);
            setDateError("");
          }}
          error={dateError || error}
        />
        <p className="text-xs text-stone">Có nhập ngày thì tạo thêm lịch chờ tiêm {item.Loai} mới cho ngựa này.</p>
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
          onClick={handleConfirm}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Đang xử lý..." : "Xác nhận đã tiêm"}
        </button>
      </div>
    </Modal>
  );
}
