import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import PlanFormContext from "./PlanFormContext";
import useAuth from "../../hooks/useAuth";
import { PLAN_UNITS, TRACK_SURFACES, TRAINING_PHASES } from "../../data/trainingPlanOptions";
import {
  createTrainingPlan,
  deleteTrainingPlan,
  getActiveTrainingLocks,
  getHealthStatuses,
  getHorses,
  getTrainingPlans,
  getUsers,
  updateTrainingPlan,
} from "../../services/trainerService";
import { toUserID } from "../../utils/userId";

const emptyForm = { HorseID: "", GiaiDoan: "", CuLy: "", KhoiLuong: "", MatSan: "" };

// Nút chọn 1 trong nhiều (giai đoạn, mặt sân) — cùng kiểu pill lọc ở các trang danh sách
const choiceClass = (active, disabled) =>
  `w-full rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
    disabled
      ? "cursor-not-allowed border-stone/15 bg-white text-stone/45"
      : active
        ? "cursor-pointer border-brass bg-brass/15 font-medium text-brass-deep"
        : "cursor-pointer border-stone/25 bg-white text-ink hover:border-stone/40"
  }`;
const LEGEND = "mb-1.5 block font-serif text-sm font-semibold text-stone";

// Form giáo án, dùng chung cho /trainer/plans/new (lập mới) và /trainer/plans/:id/edit (sửa).
// - Lập từ liên kết "Lập" ở một mốc (?horse=&phase=): ngựa + giai đoạn điền sẵn, ngựa bị khóa không đổi.
// - Mỗi ngựa tối đa 1 giáo án cho mỗi giai đoạn: giai đoạn đã lập thì mờ, không chọn được (trừ giai đoạn đang sửa).
// - Chỉ người tạo giáo án (CreatedBy) được sửa/xóa.
export default function TrainingPlanForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const currentUserId = toUserID(user.id);
  const [form, setForm] = useState(emptyForm);
  const [horseLocked, setHorseLocked] = useState(false); // vào từ liên kết "Lập" của một ngựa cụ thể
  const [horses, setHorses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [locks, setLocks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockedReason, setBlockedReason] = useState(""); // không tìm thấy / không phải người tạo
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getTrainingPlans(), getHealthStatuses(), getActiveTrainingLocks(), getUsers()]).then(
      ([horseList, planList, healthList, lockList, userList]) => {
        if (ignore) return;
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setPlans(planList);
        setHealthStatuses(healthList);
        setLocks(lockList);
        setUsers(userList);
        if (!isEdit) {
          // Điền sẵn từ liên kết "Lập" (chỉ nhận giá trị hợp lệ, giai đoạn chưa được lập)
          const horseParam = searchParams.get("horse");
          const phaseParam = searchParams.get("phase");
          const validHorse = horseList.some((h) => String(h.HorseID) === horseParam);
          const phaseTaken = planList.some((p) => String(p.HorseID) === horseParam && p.GiaiDoan === phaseParam);
          if (validHorse) {
            setHorseLocked(true);
            setForm((prev) => ({
              ...prev,
              HorseID: horseParam,
              GiaiDoan: TRAINING_PHASES.includes(phaseParam) && !phaseTaken ? phaseParam : "",
            }));
          }
        } else {
          const plan = planList.find((p) => p.PlanID === Number(id));
          if (!plan) {
            setBlockedReason("Giáo án này không tồn tại hoặc đã bị xóa.");
          } else if (plan.CreatedBy !== currentUserId) {
            setBlockedReason("Bạn chỉ được sửa giáo án do chính mình tạo.");
          } else {
            setForm({
              HorseID: String(plan.HorseID),
              GiaiDoan: plan.GiaiDoan,
              CuLy: String(plan.CuLy),
              KhoiLuong: String(plan.KhoiLuong),
              MatSan: plan.MatSan,
            });
          }
        }
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, [id, isEdit, currentUserId, searchParams]);

  const selectedHorse = horses.find((h) => h.HorseID === Number(form.HorseID));
  const horsePlans = plans.filter((p) => p.HorseID === Number(form.HorseID));
  // Giai đoạn đã có giáo án của ngựa đang chọn (bỏ qua chính giáo án đang sửa)
  const takenPhases = new Set(horsePlans.filter((p) => p.PlanID !== Number(id)).map((p) => p.GiaiDoan));
  const selectedLock = selectedHorse ? locks.find((l) => l.HorseID === selectedHorse.HorseID) ?? null : null;
  const lockedByName = selectedLock ? users.find((u) => u.UserID === selectedLock.LockedBy)?.HoTen : undefined;
  // Quay về danh sách và giữ ngựa đang làm việc được chọn
  const backToList = form.HorseID ? `/trainer/plans?horse=${form.HorseID}` : "/trainer/plans";

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Đổi ngựa: nếu giai đoạn đang chọn đã được ngựa mới lập thì bỏ chọn để HLV chọn lại
  const handleHorseChange = (e) => {
    const horseId = e.target.value;
    const taken = plans.some(
      (p) => p.HorseID === Number(horseId) && p.GiaiDoan === form.GiaiDoan && p.PlanID !== Number(id)
    );
    setForm((prev) => ({ ...prev, HorseID: horseId, GiaiDoan: taken ? "" : prev.GiaiDoan }));
    setErrors((prev) => ({ ...prev, HorseID: undefined, GiaiDoan: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.HorseID) newErrors.HorseID = "Vui lòng chọn ngựa";
    if (!form.GiaiDoan) newErrors.GiaiDoan = "Vui lòng chọn giai đoạn";
    else if (takenPhases.has(form.GiaiDoan))
      newErrors.GiaiDoan = `Ngựa này đã có giáo án giai đoạn "${form.GiaiDoan}" — hãy sửa giáo án đó hoặc chọn giai đoạn khác`;
    if (!(Number(form.CuLy) > 0)) newErrors.CuLy = "Cự ly phải là số lớn hơn 0";
    if (!(Number(form.KhoiLuong) > 0)) newErrors.KhoiLuong = "Khối lượng phải là số lớn hơn 0";
    if (!form.MatSan) newErrors.MatSan = "Vui lòng chọn mặt sân";
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
      if (isEdit) await updateTrainingPlan(id, form, currentUserId);
      else await createTrainingPlan({ ...form, CreatedBy: currentUserId });
      const horseName = selectedHorse?.Ten ?? "ngựa";
      navigate(backToList, {
        state: {
          message: isEdit
            ? `Đã cập nhật giáo án "${form.GiaiDoan}" của ${horseName}.`
            : `Đã lập giáo án "${form.GiaiDoan}" cho ${horseName}.`,
        },
      });
    } catch (err) {
      setErrors({ form: err.message || "Không lưu được giáo án, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteTrainingPlan(id, currentUserId);
      navigate(backToList, {
        state: { message: `Đã xóa giáo án "${form.GiaiDoan}" của ${selectedHorse?.Ten ?? "ngựa"}.` },
      });
    } catch (err) {
      setErrors({ form: err.message || "Không xóa được giáo án, vui lòng thử lại." });
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <LoadingState />;

  if (blockedReason) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Không thể sửa giáo án</h1>
        <p className="mt-2 text-stone">{blockedReason}</p>
        <Link to="/trainer/plans" className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={backToList} className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại danh sách
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isEdit ? "Sửa giáo án" : "Lập giáo án mới"}
      </h1>

      {/* 2 cột: form bên trái, ngữ cảnh ngựa bên phải (dính khi cuộn). Dưới lg ngữ cảnh xuống dưới form. */}
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <form onSubmit={handleSubmit} noValidate className="space-y-6 border-t border-stone/20 pt-6">
          {errors.form && (
            <p className="rounded-sm border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert">{errors.form}</p>
          )}

          <div className="sm:max-w-sm">
            <SelectField
              variant="outline"
              label="Ngựa"
              id="HorseID"
              name="HorseID"
              value={form.HorseID}
              onChange={handleHorseChange}
              disabled={horseLocked}
              error={errors.HorseID}
            >
              <option value="">Chọn ngựa</option>
              {horses.map((horse) => (
                <option key={horse.HorseID} value={horse.HorseID}>
                  {horse.Ten} — {horse.Giong}
                </option>
              ))}
            </SelectField>
            {horseLocked && <p className="mt-1.5 text-xs text-stone">Lập từ lộ trình của {selectedHorse?.Ten}.</p>}
          </div>

          <fieldset>
            <legend className={LEGEND}>Giai đoạn</legend>
            <div role="radiogroup" aria-label="Giai đoạn" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TRAINING_PHASES.map((phase) => {
                const taken = takenPhases.has(phase);
                const active = form.GiaiDoan === phase;
                return (
                  <div key={phase} className="text-center">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={taken}
                      onClick={() => setField("GiaiDoan", phase)}
                      className={choiceClass(active, taken)}
                    >
                      {phase}
                    </button>
                    {taken && <span className="mt-1 block text-xs text-stone">Đã lập</span>}
                  </div>
                );
              })}
            </div>
            {errors.GiaiDoan && <p className="mt-1.5 text-sm text-alert">{errors.GiaiDoan}</p>}
          </fieldset>

          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            <FormField
              variant="outline"
              label="Cự ly"
              id="CuLy"
              name="CuLy"
              type="number"
              min="1"
              step="100"
              inputMode="numeric"
              suffix={PLAN_UNITS.CuLy}
              value={form.CuLy}
              onChange={(e) => setField("CuLy", e.target.value)}
              error={errors.CuLy}
            />
            <FormField
              variant="outline"
              label="Khối lượng"
              id="KhoiLuong"
              name="KhoiLuong"
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              suffix={PLAN_UNITS.KhoiLuong}
              value={form.KhoiLuong}
              onChange={(e) => setField("KhoiLuong", e.target.value)}
              error={errors.KhoiLuong}
            />
          </div>

          <fieldset>
            <legend className={LEGEND}>Mặt sân</legend>
            <div role="radiogroup" aria-label="Mặt sân" className="grid grid-cols-3 gap-2 sm:max-w-sm">
              {TRACK_SURFACES.map((surface) => (
                <button
                  key={surface}
                  type="button"
                  role="radio"
                  aria-checked={form.MatSan === surface}
                  onClick={() => setField("MatSan", surface)}
                  className={choiceClass(form.MatSan === surface, false)}
                >
                  {surface}
                </button>
              ))}
            </div>
            {errors.MatSan && <p className="mt-1.5 text-sm text-alert">{errors.MatSan}</p>}
          </fieldset>

          {/* Hàng nút: Xóa (chữ, chỉ khi sửa) bên trái; Hủy + nút chính căn phải */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-stone/20 pt-5">
            {isEdit && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="cursor-pointer text-sm font-medium text-stone underline-offset-2 hover:text-alert hover:underline"
              >
                Xóa giáo án
              </button>
            )}
            <div className="ml-auto flex items-center gap-5">
              <Link to={backToList} className="text-sm font-medium text-stone underline-offset-2 hover:text-ink hover:underline">
                Hủy
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="cursor-pointer rounded-sm bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brass/85 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Lập giáo án"}
              </button>
            </div>
          </div>
        </form>

        <aside className="rounded-lg border border-stone/15 bg-white px-5 py-5 lg:sticky lg:top-24">
          <PlanFormContext
            horse={selectedHorse}
            healthStatus={healthStatuses.find((h) => h.HorseID === selectedHorse?.HorseID)?.TrangThai}
            lock={selectedLock}
            lockedByName={lockedByName}
            plans={horsePlans}
            editingPlanId={isEdit ? Number(id) : undefined}
          />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Xóa giáo án"
        message={`Bạn có chắc muốn xóa giáo án "${form.GiaiDoan}" của ${selectedHorse?.Ten ?? "ngựa này"}? Thao tác này không thể hoàn tác.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
