import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import HorsePhotoPicker from "./HorsePhotoPicker";
import { createHorse, getHorseById, getHorseOwners, updateHorse } from "../../services/horseService";

const emptyForm = { Ten: "", Giong: "", Tuoi: "", CanNang: "", DongDoi: "", OwnerID: "", photo: null };

// Dùng chung cho /manager/horses/new (thêm) và /manager/horses/:id/edit (sửa)
export default function HorseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock horseService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorseOwners(), isEdit ? getHorseById(id) : null]).then(([ownerList, horse]) => {
      if (ignore) return;
      setOwners(ownerList);
      if (isEdit) {
        if (horse) {
          setForm({
            Ten: horse.Ten,
            Giong: horse.Giong,
            Tuoi: String(horse.Tuoi),
            CanNang: String(horse.CanNang),
            DongDoi: horse.DongDoi,
            OwnerID: String(horse.OwnerID),
            photo: horse.photo ?? null,
          });
        } else {
          setNotFound(true);
        }
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handlePhotoChange = (photo) => {
    setForm((prev) => ({ ...prev, photo }));
    setErrors((prev) => ({ ...prev, photo: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.Ten.trim()) newErrors.Ten = "Vui lòng nhập tên ngựa";
    if (!form.OwnerID) newErrors.OwnerID = "Vui lòng chọn chủ sở hữu";
    if (!(Number(form.Tuoi) > 0)) newErrors.Tuoi = "Tuổi phải là số dương";
    if (!(Number(form.CanNang) > 0)) newErrors.CanNang = "Cân nặng phải là số dương";
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
      const saved = isEdit ? await updateHorse(id, form) : await createHorse(form);
      navigate("/manager/horses", {
        state: { message: isEdit ? `Đã cập nhật hồ sơ ngựa "${saved.Ten}".` : `Đã thêm ngựa "${saved.Ten}".` },
      });
    } catch {
      setErrors({ form: "Không lưu được hồ sơ ngựa, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Không tìm thấy ngựa</h1>
        <p className="mt-2 text-stone">Hồ sơ ngựa này không tồn tại hoặc đã bị xóa.</p>
        <Link to="/manager/horses" className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/manager/horses" className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại danh sách
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">{isEdit ? "Sửa hồ sơ ngựa" : "Thêm ngựa mới"}</h1>
      <p className="mt-2 text-stone">
        {isEdit ? "Cập nhật thông tin hồ sơ ngựa." : "Nhập thông tin hồ sơ cho ngựa mới của câu lạc bộ."}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {errors.form && (
          <p className="rounded-sm border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert">{errors.form}</p>
        )}

        <HorsePhotoPicker
          photo={form.photo}
          horseName={form.Ten}
          error={errors.photo}
          onChange={handlePhotoChange}
          onError={(message) => setErrors((prev) => ({ ...prev, photo: message }))}
        />

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <FormField
            variant="line"
            label="Tên ngựa"
            id="Ten"
            name="Ten"
            value={form.Ten}
            onChange={handleChange}
            error={errors.Ten}
          />
          <FormField variant="line" label="Giống" id="Giong" name="Giong" value={form.Giong} onChange={handleChange} />
        </div>

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <FormField
            variant="line"
            label="Tuổi"
            id="Tuoi"
            name="Tuoi"
            type="number"
            min="1"
            value={form.Tuoi}
            onChange={handleChange}
            error={errors.Tuoi}
          />
          <FormField
            variant="line"
            label="Cân nặng (kg)"
            id="CanNang"
            name="CanNang"
            type="number"
            min="1"
            value={form.CanNang}
            onChange={handleChange}
            error={errors.CanNang}
          />
        </div>

        <FormField variant="line" label="Dòng dõi" id="DongDoi" name="DongDoi" value={form.DongDoi} onChange={handleChange} />

        <SelectField
          variant="line"
          label="Chủ sở hữu"
          id="OwnerID"
          name="OwnerID"
          value={form.OwnerID}
          onChange={handleChange}
          error={errors.OwnerID}
        >
          <option value="">Chọn chủ ngựa</option>
          {owners.map((owner) => (
            <option key={owner.UserID} value={owner.UserID}>
              {owner.HoTen}
            </option>
          ))}
        </SelectField>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full cursor-pointer rounded-sm bg-brass py-3 font-semibold text-ink transition-colors hover:bg-brass/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm ngựa"}
        </button>
      </form>
    </div>
  );
}
