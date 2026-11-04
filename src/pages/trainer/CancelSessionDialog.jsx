import { useState } from "react";
import Modal from "../../components/Modal";
import TextAreaField from "../../components/TextAreaField";
import { SESSION_RULES } from "../../data/trainingCodes";

// Hủy buổi tập: bắt buộc nhập lý do (≤ 450 ký tự) — BE ghi kết quả "Đã hủy: <lý do>".
// Component được mount lại mỗi lần mở (key ở trang cha) nên ô lý do luôn trống.
export default function CancelSessionDialog({ open, sessionTitle, loading, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    if (!loading) onCancel();
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Vui lòng nhập lý do hủy");
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Modal open={open} title="Hủy buổi tập" onClose={handleClose} size="sm">
      <p className="mb-4 text-sm text-stone">
        Hủy buổi "{sessionTitle}". Buổi đã hủy vẫn được giữ lại trong lịch sử, không tính vào tải tập.
      </p>
      <TextAreaField
        label="Lý do hủy"
        id="cancelReason"
        rows={3}
        value={reason}
        maxLength={SESSION_RULES.cancelReasonMax}
        placeholder="VD: Sân ướt do mưa"
        onChange={(e) => {
          setReason(e.target.value);
          setError("");
        }}
        error={error}
      />
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 font-semibold transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="cursor-pointer rounded-xl bg-alert px-5 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-alert/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Đang xử lý..." : "Hủy buổi tập"}
        </button>
      </div>
    </Modal>
  );
}
