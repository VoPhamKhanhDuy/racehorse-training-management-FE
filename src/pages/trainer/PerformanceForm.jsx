import { useState } from "react";
import FormField from "../../components/FormField";
import SelectField from "../../components/SelectField";
import { todayISO } from "../../utils/date";

const CHI_SO_TAP_OPTIONS = ["Tốt", "Khá", "Trung bình", "Kém"];

// Form thêm đánh giá phong độ (bảng TRAININGSESSION)
export default function PerformanceForm({ horses, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    HorseID: "",
    Ngay: todayISO(),
    NhipTim: "",
    VanToc: "",
    ChiSoTap: CHI_SO_TAP_OPTIONS[0],
    NhanXet: "",
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
    if (!form.Ngay) newErrors.Ngay = "Vui lòng chọn ngày tập";
    else if (form.Ngay > todayISO()) newErrors.Ngay = "Không thể đánh giá buổi tập chưa diễn ra";
    const nhipTim = Number(form.NhipTim);
    if (!Number.isInteger(nhipTim) || nhipTim < 20 || nhipTim > 250)
      newErrors.NhipTim = "Nhịp tim từ 20 đến 250 nhịp/phút";
    const vanToc = Number(form.VanToc);
    if (!(vanToc > 0 && vanToc <= 25)) newErrors.VanToc = "Vận tốc từ 0 đến 25 m/s";
    if (!form.NhanXet.trim()) newErrors.NhanXet = "Vui lòng nhập nhận xét";
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
      await onSubmit({ ...form, NhanXet: form.NhanXet.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Ngựa" id="HorseID" name="HorseID" value={form.HorseID} onChange={handleChange} error={errors.HorseID}>
          <option value="">Chọn ngựa</option>
          {horses.map((horse) => (
            <option key={horse.HorseID} value={horse.HorseID}>
              {horse.Ten}
            </option>
          ))}
        </SelectField>
        <FormField
          label="Ngày tập"
          id="Ngay"
          name="Ngay"
          type="date"
          max={todayISO()}
          value={form.Ngay}
          onChange={handleChange}
          error={errors.Ngay}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nhịp tim (nhịp/phút)"
          id="NhipTim"
          name="NhipTim"
          type="number"
          min="20"
          max="250"
          value={form.NhipTim}
          onChange={handleChange}
          error={errors.NhipTim}
        />
        <FormField
          label="Vận tốc (m/s)"
          id="VanToc"
          name="VanToc"
          type="number"
          min="0"
          step="0.1"
          value={form.VanToc}
          onChange={handleChange}
          error={errors.VanToc}
        />
      </div>

      <SelectField label="Chỉ số tập" id="ChiSoTap" name="ChiSoTap" value={form.ChiSoTap} onChange={handleChange}>
        {CHI_SO_TAP_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectField>

      <FormField
        label="Nhận xét"
        id="NhanXet"
        name="NhanXet"
        placeholder="Nhận xét chuyên môn sau buổi tập"
        value={form.NhanXet}
        onChange={handleChange}
        error={errors.NhanXet}
      />

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
          {submitting ? "Đang lưu..." : "Lưu đánh giá"}
        </button>
      </div>
    </form>
  );
}
