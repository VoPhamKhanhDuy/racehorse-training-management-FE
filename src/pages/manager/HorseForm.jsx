import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import HorsePhotoPicker from "./HorsePhotoPicker";
import { getHorseById, getHorseOwners, getHorses, saveHorseWithPhoto } from "../../services/horseService";
import { COAT_COLORS, DUPLICATE_HORSE_NAME, HORSE_GENDERS, HORSE_LIMITS, INVALID_BIRTH_DATE } from "../../data/horseOptions";
import { getHorseAge, todayISO } from "../../utils/date";
import GenderChips from "./GenderChips";

const emptyForm = { Ten: "", Giong: "", NgaySinh: "", GioiTinh: "", MauLong: "", CanNang: "", DongDoi: "", OwnerID: "", photo: null };

const collapseSpaces = (text) => text.trim().replace(/\s+/g, " ");
const sameText = (a, b) => a.toLocaleLowerCase("vi") === b.toLocaleLowerCase("vi");

// Kiểm tra form theo HORSE_LIMITS; otherHorses = các ngựa khác (để bắt trùng tên). Trả { field: thông báo }
function validateHorse(form, otherHorses) {
  const errors = {};
  const name = collapseSpaces(form.Ten);
  const { Ten, Age, CanNang, DongDoi } = HORSE_LIMITS;

  if (!name) errors.Ten = "Vui lòng nhập tên ngựa.";
  else if (name.length < Ten.min || name.length > Ten.max) errors.Ten = `Tên ngựa phải từ ${Ten.min} đến ${Ten.max} ký tự.`;
  else if (otherHorses.some((h) => sameText(h.Ten, name))) errors.Ten = DUPLICATE_HORSE_NAME;

  if (!form.Giong.trim()) errors.Giong = "Vui lòng nhập giống ngựa.";

  // Tuổi không nhập trực tiếp: tính từ NgaySinh, phải nằm trong 1–40 (ngày tương lai cũng rơi vào đây)
  if (!form.NgaySinh) errors.NgaySinh = "Vui lòng chọn ngày sinh.";
  else {
    const age = getHorseAge(form.NgaySinh);
    if (form.NgaySinh > todayISO() || age < Age.min || age > Age.max) errors.NgaySinh = INVALID_BIRTH_DATE;
  }

  if (!form.GioiTinh) errors.GioiTinh = "Vui lòng chọn giới tính.";
  if (!form.MauLong.trim()) errors.MauLong = "Vui lòng nhập màu lông.";

  const weight = form.CanNang.trim();
  if (!weight) errors.CanNang = "Vui lòng nhập cân nặng.";
  else if (!/^\d+(\.\d+)?$/.test(weight)) errors.CanNang = "Cân nặng phải là số.";
  else if (!/^\d+(\.\d)?$/.test(weight)) errors.CanNang = "Cân nặng chỉ được có tối đa một chữ số thập phân.";
  else if (Number(weight) < CanNang.min || Number(weight) > CanNang.max) {
    errors.CanNang = `Cân nặng phải từ ${CanNang.min} đến ${CanNang.max} kg.`;
  }

  const lineage = collapseSpaces(form.DongDoi);
  if (!lineage) errors.DongDoi = "Vui lòng nhập dòng dõi.";
  else if (lineage.length < DongDoi.min || lineage.length > DongDoi.max) {
    errors.DongDoi = `Dòng dõi phải từ ${DongDoi.min} đến ${DongDoi.max} ký tự.`;
  }

  if (!form.OwnerID) errors.OwnerID = "Vui lòng chọn chủ ngựa.";
  return errors;
}

// Dùng chung cho /manager/horses/new (thêm) và /manager/horses/:id/edit (sửa)
export default function HorseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [owners, setOwners] = useState([]);
  const [horses, setHorses] = useState([]); // toàn bộ ngựa: bắt trùng tên + gợi ý giống
  const [originalOwnerId, setOriginalOwnerId] = useState(""); // chủ hiện tại khi sửa (có thể đã bị khóa)
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([getHorseOwners(), getHorses(), isEdit ? getHorseById(id) : null]).then(([ownerList, horseList, horse]) => {
      if (ignore) return;
      setOwners(ownerList);
      setHorses(horseList);
      if (isEdit) {
        if (horse) {
          setForm({
            Ten: horse.Ten,
            Giong: horse.Giong,
            NgaySinh: horse.NgaySinh ?? "",
            GioiTinh: horse.GioiTinh ?? "",
            MauLong: horse.MauLong ?? "",
            CanNang: String(horse.CanNang),
            DongDoi: horse.DongDoi,
            OwnerID: String(horse.OwnerID),
            photo: horse.photo ?? null,
          });
          setOriginalPhotoUrl(horse.photo ?? null);
          setPhotoFile(null);
          setOriginalOwnerId(String(horse.OwnerID));
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

  // Gợi ý giống: các giống đã có, bỏ trùng không phân biệt hoa thường (giữ cách viết gặp đầu tiên)
  const breedOptions = horses
    .map((h) => h.Giong)
    .filter((breed, i, all) => breed && all.findIndex((b) => sameText(b, breed)) === i)
    .sort((a, b) => a.localeCompare(b, "vi"));

  // Gợi ý màu lông: danh sách cố định + màu đã có trong dữ liệu, bỏ trùng không phân biệt hoa thường
  const coatOptions = [...COAT_COLORS, ...horses.map((h) => h.MauLong)].filter(
    (color, i, all) => color && all.findIndex((c) => c && sameText(c, color)) === i
  );

  // Tuổi xem trước dưới ô Ngày sinh (cập nhật ngay khi chọn ngày)
  const birthAge = getHorseAge(form.NgaySinh);

  // Chỉ cho chọn chủ ngựa đang hoạt động; khi sửa, vẫn giữ chủ hiện tại dù tài khoản đã bị khóa
  const ownerOptions = owners.filter((o) => o.isActive || String(o.UserID) === originalOwnerId);
  const selectedOwner = owners.find((o) => String(o.UserID) === form.OwnerID);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleGenderChange = (gender) => {
    setForm((prev) => ({ ...prev, GioiTinh: gender }));
    setErrors((prev) => ({ ...prev, GioiTinh: undefined }));
  };

  const handlePhotoChange = (photo, file = null) => {
    setForm((prev) => ({ ...prev, photo }));
    setPhotoFile(file);
    setErrors((prev) => ({ ...prev, photo: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otherHorses = horses.filter((h) => h.HorseID !== Number(id));
    const newErrors = validateHorse(form, otherHorses);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      const saved = await saveHorseWithPhoto({
        horseId: isEdit ? id : null,
        form,
        photoFile,
        originalPhotoUrl,
      });

      navigate("/manager/horses", {
        state: { message: isEdit ? `Đã cập nhật hồ sơ ngựa "${saved.Ten}".` : `Đã thêm ngựa "${saved.Ten}".` },
      });
    } catch (err) {
      if (err.message === DUPLICATE_HORSE_NAME) setErrors({ Ten: err.message });
      else if (err.message === INVALID_BIRTH_DATE) setErrors({ NgaySinh: err.message });
      else if (err.field === "photo") setErrors({ photo: err.message });
      else setErrors({ form: err.message ?? "Không lưu được hồ sơ ngựa, vui lòng thử lại." });
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
          <p className="rounded-sm border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{errors.form}</p>
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
            placeholder="Ví dụ: Blaze"
            value={form.Ten}
            onChange={handleChange}
            error={errors.Ten}
          />
          {/* Ô gõ có gợi ý: chọn giống đã có hoặc nhập giống mới (lưu sẽ viết hoa chữ cái đầu mỗi từ) */}
          <div>
            <FormField
              variant="line"
              label="Giống"
              id="Giong"
              name="Giong"
              list="horseBreedOptions"
              placeholder="Ví dụ: Thoroughbred"
              autoComplete="off"
              value={form.Giong}
              onChange={handleChange}
              error={errors.Giong}
            />
            <datalist id="horseBreedOptions">
              {breedOptions.map((breed) => (
                <option key={breed} value={breed} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {/* Không cho chọn ngày tương lai; tuổi tính ngay từ ngày đã chọn */}
          <div>
            <FormField
              variant="line"
              label="Ngày sinh"
              id="NgaySinh"
              name="NgaySinh"
              type="date"
              max={todayISO()}
              value={form.NgaySinh}
              onChange={handleChange}
              error={errors.NgaySinh}
            />
            {birthAge !== null && <p className="mt-1 text-xs text-stone">= {birthAge} tuổi</p>}
          </div>
          <GenderChips value={form.GioiTinh} options={HORSE_GENDERS} error={errors.GioiTinh} onChange={handleGenderChange} />
        </div>

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {/* Ô gõ có gợi ý màu lông; nhập màu khác vẫn được (lưu sẽ viết hoa chữ cái đầu) */}
          <div>
            <FormField
              variant="line"
              label="Màu lông"
              id="MauLong"
              name="MauLong"
              list="horseCoatOptions"
              placeholder="Ví dụ: Hạt dẻ"
              autoComplete="off"
              value={form.MauLong}
              onChange={handleChange}
              error={errors.MauLong}
            />
            <datalist id="horseCoatOptions">
              {coatOptions.map((color) => (
                <option key={color} value={color} />
              ))}
            </datalist>
          </div>
          <FormField
            variant="line"
            label="Cân nặng (kg)"
            id="CanNang"
            name="CanNang"
            type="number"
            inputMode="decimal"
            min={HORSE_LIMITS.CanNang.min}
            max={HORSE_LIMITS.CanNang.max}
            step="0.1"
            placeholder="Ví dụ: 480"
            value={form.CanNang}
            onChange={handleChange}
            error={errors.CanNang}
          />
        </div>

        <FormField
          variant="line"
          label="Dòng dõi"
          id="DongDoi"
          name="DongDoi"
          placeholder="Tên ngựa giống (cha), ví dụ: Northern Dancer"
          value={form.DongDoi}
          onChange={handleChange}
          error={errors.DongDoi}
        />

        <div>
          <SelectField
            variant="line"
            label="Chủ ngựa"
            id="OwnerID"
            name="OwnerID"
            value={form.OwnerID}
            onChange={handleChange}
            error={errors.OwnerID}
          >
            <option value="">Chọn chủ ngựa</option>
            {ownerOptions.map((owner) => (
              <option key={owner.UserID} value={owner.UserID}>
                {owner.HoTen} · {owner.Email}
                {!owner.isActive && " (tài khoản đã khóa)"}
              </option>
            ))}
          </SelectField>
          {selectedOwner && !selectedOwner.isActive && (
            <p className="mt-1.5 text-sm text-stone">{selectedOwner.HoTen} (tài khoản đã khóa)</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Link
            to="/manager/horses"
            className="rounded-sm border border-stone/30 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 hover:bg-black/[0.03]"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm ngựa"}
          </button>
        </div>
      </form>
    </div>
  );
}
