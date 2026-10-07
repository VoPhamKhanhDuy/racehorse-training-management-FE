import { useState } from "react";
import FormField from "../../components/FormField";
import SelectField from "../../components/SelectField";

const GIAI_DOAN_OPTIONS = ["Nền tảng", "Tăng tốc", "Tiền thi đấu", "Phục hồi"];
const MAT_SAN_OPTIONS = ["Đường đất", "Đường cỏ", "Đường cát"];

// Form thêm giáo án (bảng TRAININGPLAN) — dùng trong Modal của trang TrainingPlans
// healthByHorse: { [HorseID]: TrangThai } để khóa ngựa đang chấn thương
export default function TrainingPlanForm({ horses, healthByHorse, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    HorseID: "",
    GiaiDoan: GIAI_DOAN_OPTIONS[0],
    CuLy: "",
    KhoiLuong: "",
    MatSan: MAT_SAN_OPTIONS[0],
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.HorseID) newErrors.HorseID = "Vui lòng chọn ngựa";
    if (!(Number(form.CuLy) > 0)) newErrors.CuLy = "Cự ly phải lớn hơn 0";
    if (!(Number(form.KhoiLuong) > 0)) newErrors.KhoiLuong = "Khối lượng phải lớn hơn 0";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <SelectField label="Ngựa" id="HorseID" name="HorseID" value={form.HorseID} onChange={handleChange} error={errors.HorseID}>
        <option value="">Chọn ngựa</option>
        {horses.map((horse) => {
          // Ngựa đang chấn thương không được lên giáo án mới
          const injured = healthByHorse[horse.HorseID] === "Chấn thương";
          return (
            <option key={horse.HorseID} value={horse.HorseID} disabled={injured}>
              {horse.Ten} ({horse.Giong}){injured ? " – đang chấn thương" : ""}
            </option>
          );
        })}
      </SelectField>

      <SelectField label="Giai đoạn" id="GiaiDoan" name="GiaiDoan" value={form.GiaiDoan} onChange={handleChange}>
        {GIAI_DOAN_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Cự ly (m)"
          id="CuLy"
          name="CuLy"
          type="number"
          min="1"
          step="100"
          value={form.CuLy}
          onChange={handleChange}
          error={errors.CuLy}
        />
        <FormField
          label="Khối lượng"
          id="KhoiLuong"
          name="KhoiLuong"
          type="number"
          min="1"
          value={form.KhoiLuong}
          onChange={handleChange}
          error={errors.KhoiLuong}
        />
      </div>

      <SelectField label="Mặt sân" id="MatSan" name="MatSan" value={form.MatSan} onChange={handleChange}>
        {MAT_SAN_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectField>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 font-semibold transition-colors hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Đang lưu..." : "Lưu giáo án"}
        </button>
      </div>
    </form>
  );
}
