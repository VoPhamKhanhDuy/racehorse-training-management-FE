import { useState } from "react";
import CenterDialog from "../../components/CenterDialog";

const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";

// Xác nhận một dòng trước khi gửi đánh giá cho chủ ngựa. onConfirm có thể là async; lỗi hiện ngay trong hộp.
export default function SendReviewConfirmDialog({ onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || "Không gửi được đánh giá, vui lòng thử lại.");
      setBusy(false);
    }
  };

  return (
    <CenterDialog
      label="Gửi chủ ngựa"
      narrow
      busy={busy}
      onClose={onClose}
      header={<h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">Gửi chủ ngựa</h2>}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className={OUTLINE_BUTTON}>
            Hủy
          </button>
          <button type="button" onClick={handleConfirm} disabled={busy} className="btn-primary">
            {busy ? "Đang gửi..." : "Gửi chủ ngựa"}
          </button>
        </div>
      }
    >
      <p className="text-sm text-[#2b2118]">Chủ ngựa sẽ thấy điểm và nhận xét này</p>
      {error && <p className="mt-3 text-sm text-alert">{error}</p>}
    </CenterDialog>
  );
}
