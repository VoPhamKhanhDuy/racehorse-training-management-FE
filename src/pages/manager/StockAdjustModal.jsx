import { useState } from "react";
import FormField from "../../components/FormField";
import Modal from "../../components/Modal";

const MODES = {
  in: { title: "Nhập kho", confirmLabel: "Nhập kho", sign: 1 },
  out: { title: "Xuất kho", confirmLabel: "Xuất kho", sign: -1 },
};

// Hộp nhập số lượng nhập kho / xuất kho cho 1 vật tư. Xuất không được vượt số tồn.
// onSubmit(delta) trả về Promise; lỗi từ service (vd tồn kho thay đổi) hiện ngay trong hộp.
// Cha truyền key theo vật tư + chế độ để form reset mỗi lần mở.
export default function StockAdjustModal({ supply, mode, onSubmit, onClose }) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const config = MODES[mode] ?? MODES.in;

  if (!supply) return null;

  const amount = Number(quantity);
  const isValidAmount = Number.isInteger(amount) && amount > 0;
  const nextStock = isValidAmount ? supply.SoLuongTon + config.sign * amount : null;

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidAmount) {
      setError("Số lượng phải là số nguyên lớn hơn 0");
      return;
    }
    if (mode === "out" && amount > supply.SoLuongTon) {
      setError(`Không thể xuất quá số tồn (còn ${supply.SoLuongTon.toLocaleString("vi-VN")})`);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(config.sign * amount);
    } catch (err) {
      setError(err.message || "Không cập nhật được tồn kho, vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  return (
    <Modal open title={`${config.title}: ${supply.TenVatTu}`} onClose={handleClose} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <p className="text-sm text-stone">
          Tồn kho hiện tại:{" "}
          <span className="font-semibold text-ink tabular-nums">{supply.SoLuongTon.toLocaleString("vi-VN")}</span>
        </p>
        <div className="mt-4">
          <FormField
            variant="outline"
            label={mode === "out" ? "Số lượng xuất" : "Số lượng nhập"}
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            autoFocus
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setError("");
            }}
            error={error}
          />
        </div>
        {nextStock !== null && nextStock >= 0 && (
          <p className="mt-3 text-sm text-stone">
            Tồn kho sau khi {mode === "out" ? "xuất" : "nhập"}:{" "}
            <span className="font-semibold text-ink tabular-nums">{nextStock.toLocaleString("vi-VN")}</span>
          </p>
        )}

        {/* Cùng kiểu 2 nút của ConfirmDialog */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 font-semibold transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang xử lý..." : config.confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
