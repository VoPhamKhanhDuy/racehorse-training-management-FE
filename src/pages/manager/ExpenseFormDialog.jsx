import { useState } from "react";
import FormField from "../../components/FormField";
import Modal from "../../components/Modal";
import SelectField from "../../components/SelectField";
import { EXPENSE_NOTE_MAX, EXPENSE_TYPES } from "../../data/expenseOptions";
import { todayISO } from "../../utils/date";

// Kiểm tra form chi phí, trả { field: thông báo tiếng Việt }
function validate(form) {
  const errors = {};
  if (!form.HorseID) errors.HorseID = "Vui lòng chọn ngựa.";
  if (!form.LoaiChiPhi) errors.LoaiChiPhi = "Vui lòng chọn loại chi phí.";
  const amount = Number(form.SoTien);
  if (!form.SoTien) errors.SoTien = "Vui lòng nhập số tiền.";
  else if (!Number.isInteger(amount) || amount <= 0) errors.SoTien = "Số tiền phải là số nguyên lớn hơn 0.";
  if (!form.Ngay) errors.Ngay = "Vui lòng chọn ngày.";
  else if (form.Ngay > todayISO()) errors.Ngay = "Ngày không được ở tương lai.";
  if (form.GhiChu.trim().length > EXPENSE_NOTE_MAX) errors.GhiChu = `Ghi chú tối đa ${EXPENSE_NOTE_MAX} ký tự.`;
  return errors;
}

// Hộp thoại thêm / sửa 1 khoản chi phí (EXPENSE), 2 cột. expense = null → thêm mới.
// onSave(form) trả Promise; lỗi từ service hiện ở đầu form. Gắn dialog bằng `key` để mỗi lần mở có state sạch.
export default function ExpenseFormDialog({ expense, horses, onSave, onClose }) {
  const isEdit = Boolean(expense);
  const [form, setForm] = useState({
    HorseID: expense ? String(expense.HorseID) : "",
    LoaiChiPhi: expense?.LoaiChiPhi ?? "",
    SoTien: expense ? String(expense.SoTien) : "",
    Ngay: expense?.Ngay ?? todayISO(),
    GhiChu: expense?.GhiChu ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setErrors({ form: err.message || "Không lưu được khoản chi phí, vui lòng thử lại." });
      setSaving(false);
    }
  };

  return (
    <Modal open title={isEdit ? "Sửa chi phí" : "Thêm chi phí"} onClose={saving ? () => {} : onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {errors.form && <p className="mb-4 rounded-sm border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{errors.form}</p>}

        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <SelectField
            variant="outline"
            label="Ngựa"
            id="expenseHorse"
            value={form.HorseID}
            onChange={(e) => setField("HorseID", e.target.value)}
            error={errors.HorseID}
          >
            <option value="">Chọn ngựa</option>
            {horses.map((horse) => (
              <option key={horse.HorseID} value={horse.HorseID}>
                {horse.Ten}
              </option>
            ))}
          </SelectField>

          <SelectField
            variant="outline"
            label="Loại chi phí"
            id="expenseType"
            value={form.LoaiChiPhi}
            onChange={(e) => setField("LoaiChiPhi", e.target.value)}
            error={errors.LoaiChiPhi}
          >
            <option value="">Chọn loại</option>
            {EXPENSE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectField>

          <FormField
            variant="outline"
            label="Số tiền"
            id="expenseAmount"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            placeholder="Ví dụ: 4200000"
            suffix="đ"
            value={form.SoTien}
            onChange={(e) => setField("SoTien", e.target.value)}
            error={errors.SoTien}
          />

          <FormField
            variant="outline"
            label="Ngày"
            id="expenseDate"
            type="date"
            max={todayISO()}
            value={form.Ngay}
            onChange={(e) => setField("Ngay", e.target.value)}
            error={errors.Ngay}
          />

          <div className="sm:col-span-2">
            <FormField
              variant="outline"
              label="Ghi chú"
              id="expenseNote"
              placeholder="Ví dụ: Cỏ khô tháng 10"
              value={form.GhiChu}
              onChange={(e) => setField("GhiChu", e.target.value)}
              error={errors.GhiChu}
            />
            <div className="mt-1 flex items-start justify-between gap-4 text-xs text-stone">
              <span>Chủ ngựa sẽ thấy ghi chú này, không ghi chẩn đoán hay tên bệnh.</span>
              <span className={`shrink-0 tabular-nums ${form.GhiChu.trim().length > EXPENSE_NOTE_MAX ? "text-rust" : ""}`}>
                {form.GhiChu.trim().length}/{EXPENSE_NOTE_MAX}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-stone/15 pt-5">
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
