import { useState } from "react";
import FormField from "../../components/FormField";
import Modal from "../../components/Modal";

// Hộp thoại nhập / sửa tiền thưởng (RACEREGISTRATION.TienThuong) của 1 lượt đăng ký đã có hạng ≥ 1:
// "<Ngựa> · <Giải> · Hạng n" + 1 ô "Số tiền (đ)" chỉ nhận số nguyên > 0. target: { race, horse, registration };
// onSave(amount: number) trả Promise. Gắn bằng `key` để mỗi lần mở có state sạch.
export default function PrizeDialog({ target, onSave, onClose }) {
  const { race, horse, registration } = target;
  const [value, setValue] = useState(
    registration.TienThuong !== null && registration.TienThuong !== undefined ? String(registration.TienThuong) : ""
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(value);
    if (!value) return setError("Vui lòng nhập số tiền thưởng.");
    if (!Number.isInteger(amount) || amount <= 0) return setError("Số tiền phải là số nguyên lớn hơn 0.");
    setSaving(true);
    try {
      await onSave(amount);
    } catch (err) {
      setError(err.message || "Không lưu được tiền thưởng, vui lòng thử lại.");
      setSaving(false);
    }
  };

  return (
    <Modal open title="Nhập tiền thưởng" onClose={saving ? () => {} : onClose} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <p className="text-sm text-stone">
          {horse.Ten} · {race.TenGiai} · Hạng {registration.ThuHang}
        </p>
        <div className="mt-4">
          <FormField
            variant="outline"
            label="Số tiền (đ)"
            id="prizeAmount"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ví dụ: 20000000"
            value={value}
            // Chỉ nhận chữ số → số nguyên không âm
            onChange={(e) => {
              setValue(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            error={error}
            autoFocus
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 cursor-pointer rounded-sm border border-stone/30 px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
