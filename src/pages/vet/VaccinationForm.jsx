import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import useAuth from "../../hooks/useAuth";
import VaccinationFormContext from "./VaccinationFormContext";
import {
  createVaccination,
  deleteVaccination,
  getHorses,
  getVaccinationById,
  getVaccinations,
  updateVaccination,
} from "../../services/vetService";
import { addAuditLog } from "../../services/auditService";
import { DUPLICATE_PENDING_VACCINE, VACCINE_PENDING, VACCINE_TYPE_LIMITS, VACCINE_TYPES } from "../../data/vaccinationOptions";
import { todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const sameText = (a, b) => a.toLocaleLowerCase("vi") === b.toLocaleLowerCase("vi");

// Kiểm tra form. original: lịch đang sửa (giữ nguyên ngày cũ — kể cả đã quá hạn — vẫn hợp lệ). Trả { field: thông báo }
function validateVaccination(form, items, original) {
  const errors = {};
  const { min, max } = VACCINE_TYPE_LIMITS;
  if (!form.HorseID) errors.HorseID = "Vui lòng chọn ngựa.";
  const type = form.Loai.trim();
  if (!type) errors.Loai = "Vui lòng nhập loại tiêm phòng / tẩy giun.";
  else if (type.length < min || type.length > max) errors.Loai = `Loại phải từ ${min} đến ${max} ký tự.`;
  else if (
    items.some(
      (v) => v.ScheduleID !== original?.ScheduleID && String(v.HorseID) === form.HorseID && v.TrangThai === VACCINE_PENDING && sameText(v.Loai, type)
    )
  ) {
    errors.Loai = DUPLICATE_PENDING_VACCINE;
  }
  if (!form.NgayHen) errors.NgayHen = "Vui lòng chọn ngày hẹn.";
  else if (form.NgayHen !== original?.NgayHen && form.NgayHen < todayISO()) errors.NgayHen = "Ngày hẹn phải từ hôm nay trở đi.";
  return errors;
}

// Thêm lịch tiêm (/vet/vaccinations/new, ?horse= điền sẵn) và sửa lịch chưa tiêm (/vet/vaccinations/:id/edit).
// Sửa: khóa ngựa; cho xóa lịch nhập nhầm. Lịch đã tiêm không sửa / không xóa được.
export default function VaccinationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const currentVetId = toUserID(user.id);

  const [form, setForm] = useState(() => ({ HorseID: "", Loai: "", NgayHen: todayISO() }));
  const [original, setOriginal] = useState(null);
  const [horses, setHorses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockedReason, setBlockedReason] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getVaccinations(), isEdit ? getVaccinationById(id) : null]).then(([horseList, itemList, item]) => {
      if (ignore) return;
      setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
      setItems(itemList);
      if (isEdit) {
        if (!item) setBlockedReason("Lịch tiêm này không tồn tại.");
        else if (item.TrangThai !== VACCINE_PENDING) setBlockedReason("Lịch đã tiêm không thể sửa hoặc xóa.");
        else {
          setOriginal(item);
          setForm({ HorseID: String(item.HorseID), Loai: item.Loai, NgayHen: item.NgayHen });
        }
      } else {
        // Điền sẵn từ ma trận / bộ lọc: ?horse=ID và ?type=Loại
        const preset = horseList.find((h) => String(h.HorseID) === searchParams.get("horse"));
        const presetType = searchParams.get("type") ?? "";
        setForm((prev) => ({ ...prev, HorseID: preset ? String(preset.HorseID) : prev.HorseID, Loai: presetType }));
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [id, isEdit, searchParams]);

  const selectedHorse = horses.find((h) => String(h.HorseID) === form.HorseID);
  const horseItems = items.filter((v) => String(v.HorseID) === form.HorseID);
  const horseName = selectedHorse?.Ten ?? "ngựa";
  // Lịch quá hạn đang sửa: cho giữ ngày cũ hoặc chọn ngày mới từ hôm nay
  const minDate = original && original.NgayHen < todayISO() ? undefined : todayISO();

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const log = (HanhDong, scheduleId) =>
    addAuditLog({ UserID: currentVetId, HanhDong, TargetTable: "VACCINATIONSCHEDULE", TargetID: scheduleId, targetLabel: horseName });

  const backToList = `/vet/vaccinations${form.HorseID ? `?horse=${form.HorseID}` : ""}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateVaccination(form, items, original);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      const saved = isEdit ? await updateVaccination(id, form) : await createVaccination(form);
      log(isEdit ? `Sửa lịch tiêm ${saved.Loai}` : `Thêm lịch tiêm ${saved.Loai}`, saved.ScheduleID);
      navigate(`/vet/vaccinations?horse=${saved.HorseID}`, {
        state: { toast: { text: isEdit ? `Đã cập nhật lịch ${saved.Loai} cho ${horseName}` : `Đã thêm lịch ${saved.Loai} cho ${horseName}` } },
      });
    } catch (err) {
      if (err.message === DUPLICATE_PENDING_VACCINE) setErrors({ Loai: err.message });
      else setErrors({ form: err.message || "Không lưu được lịch tiêm, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteVaccination(id);
      log(`Xóa lịch tiêm ${original.Loai}`, original.ScheduleID);
      navigate(backToList, { state: { toast: { text: `Đã xóa lịch ${original.Loai} của ${horseName}` } } });
    } catch (err) {
      setErrors({ form: err.message || "Không xóa được lịch tiêm, vui lòng thử lại." });
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <LoadingState />;

  if (blockedReason) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Không thể sửa lịch tiêm</h1>
        <p className="mt-2 text-stone">{blockedReason}</p>
        <Link to="/vet/vaccinations" className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại lịch tiêm phòng
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={backToList} className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại lịch tiêm phòng
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isEdit ? "Sửa lịch tiêm" : "Thêm lịch tiêm"}
      </h1>

      {/* 2 cột: form bên trái, ngữ cảnh ngựa bên phải (dính khi cuộn). Dưới lg ngữ cảnh xuống dưới form. */}
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-6 border-t border-stone/20 pt-6">
          {errors.form && <p className="rounded-sm border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{errors.form}</p>}

          <div className="sm:max-w-sm">
            <SelectField
              variant="line"
              label="Ngựa"
              id="HorseID"
              name="HorseID"
              value={form.HorseID}
              onChange={(e) => setField("HorseID", e.target.value)}
              disabled={isEdit}
              error={errors.HorseID}
            >
              <option value="">Chọn ngựa</option>
              {horses.map((horse) => (
                <option key={horse.HorseID} value={horse.HorseID}>
                  {horse.Ten} — {horse.Giong}
                </option>
              ))}
            </SelectField>
            {isEdit && <p className="mt-1.5 text-xs text-stone">Không đổi được ngựa của lịch đã tạo.</p>}
          </div>

          {/* Ô gõ có gợi ý: chọn loại có sẵn hoặc tự gõ loại khác */}
          <div className="sm:max-w-sm">
            <FormField
              variant="line"
              label="Loại"
              id="Loai"
              name="Loai"
              list="vaccineTypeOptions"
              placeholder="Ví dụ: Cúm ngựa, Tẩy giun"
              autoComplete="off"
              value={form.Loai}
              onChange={(e) => setField("Loai", e.target.value)}
              error={errors.Loai}
            />
            <datalist id="vaccineTypeOptions">
              {VACCINE_TYPES.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </div>

          <div className="sm:max-w-xs">
            <FormField
              variant="line"
              label="Ngày hẹn"
              id="NgayHen"
              name="NgayHen"
              type="date"
              min={minDate}
              value={form.NgayHen}
              onChange={(e) => setField("NgayHen", e.target.value)}
              error={errors.NgayHen}
            />
            {original && original.NgayHen < todayISO() && (
              <p className="mt-1.5 text-xs text-stone">Lịch đã quá hạn — chọn ngày hẹn mới từ hôm nay.</p>
            )}
          </div>

          {/* Hàng nút: "Xóa lịch này" (chữ, chỉ khi sửa) bên trái; Hủy + Lưu căn phải */}
          <div className="flex flex-wrap items-center gap-3 border-t border-stone/20 pt-5">
            {isEdit && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="cursor-pointer text-sm font-medium text-stone underline-offset-2 hover:text-rust hover:underline"
              >
                Xóa lịch này
              </button>
            )}
            <div className="ml-auto flex gap-3">
              <Link
                to={backToList}
                className="rounded-sm border border-stone/30 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 hover:bg-black/[0.03]"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </form>

        <aside className="rounded-lg border border-stone/15 bg-white px-5 py-5 lg:sticky lg:top-24">
          <VaccinationFormContext horse={selectedHorse} items={horseItems} editingId={original?.ScheduleID} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Xóa lịch tiêm"
        message={`Xóa lịch ${original?.Loai ?? ""} của ${horseName}? Chỉ nên xóa khi nhập nhầm. Hành động này không thể hoàn tác.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
