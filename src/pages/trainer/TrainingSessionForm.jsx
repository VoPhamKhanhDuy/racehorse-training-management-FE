import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import TextAreaField from "../../components/TextAreaField";
import TrainingBadge from "../../components/TrainingBadge";
import HorseFitnessPanel from "./HorseFitnessPanel";
import { POOL_SURFACE, SESSION_RULES, SWIMMING_TYPE } from "../../data/trainingCodes";
import useHorseFitness from "../../hooks/useHorseFitness";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import {
  addPlanSession,
  getAssignableStaff,
  getTrainingPlan,
  getTrainingSession,
  updateTrainingSession,
} from "../../services/trainingApi";
import { formatDate, todayISO, weekdayName } from "../../utils/date";
import { formatKm, formatMinutes, intensityRank, lowerIntensity } from "../../utils/trainingFormat";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const emptyForm = {
  trainingDate: "",
  startTime: "06:00",
  trainingType: "",
  distanceKm: "",
  durationMinutes: "",
  surface: "",
  sessionTitle: "",
  notes: "",
  assignee: "",
};

const findPhase = (plan, date) => plan?.phases.find((p) => p.startDate <= date && date <= p.endDate) ?? null;

// Thêm buổi tập thủ công vào giáo án đang áp dụng (/trainer/plans/:planId/sessions/new, ?date= điền sẵn ngày)
// và sửa buổi chưa bắt đầu (/trainer/sessions/:id/edit — PUT ghi đè toàn bộ nên form luôn gửi lại người phụ trách,
// tiêu đề, ghi chú). Ngày tập phải nằm trong 1 giai đoạn; cường độ bài tập ≤ cường độ giai đoạn và ≤ mức thể trạng cho phép.
export default function TrainingSessionForm() {
  const { id, planId: planIdParam } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { options, label } = useTrainingOptions();

  const [plan, setPlan] = useState(null);
  const [session, setSession] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fitnessState = useHorseFitness(plan?.horseId);
  const fitness = fitnessState.fitness;

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      const sessionData = isEdit ? await getTrainingSession(id) : null;
      const [planData, staffList] = await Promise.all([
        getTrainingPlan(isEdit ? sessionData.planId : planIdParam),
        getAssignableStaff(),
      ]);
      return { sessionData, planData, staffList };
    };
    load()
      .then(({ sessionData, planData, staffList }) => {
        if (ignore) return;
        setPlan(planData);
        setStaff(staffList);
        if (sessionData) {
          setSession(sessionData);
          setForm({
            trainingDate: sessionData.trainingDate,
            startTime: sessionData.startTime ?? "06:00",
            trainingType: sessionData.trainingType ?? "",
            distanceKm: sessionData.distanceKm != null ? String(sessionData.distanceKm) : "",
            durationMinutes: sessionData.durationMinutes != null ? String(sessionData.durationMinutes) : "",
            surface: sessionData.surface ?? "",
            sessionTitle: sessionData.sessionTitle ?? "",
            notes: sessionData.notes ?? "",
            assignee: sessionData.assignedToUserId ? String(sessionData.assignedToUserId) : "",
          });
        } else {
          const today = todayISO();
          const dateParam = searchParams.get("date");
          const fallback = planData.startDate > today ? planData.startDate : today;
          setForm({ ...emptyForm, trainingDate: DATE_PATTERN.test(dateParam ?? "") && dateParam >= today ? dateParam : fallback });
        }
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err);
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, isEdit, planIdParam, searchParams, reloadKey]);

  const phase = findPhase(plan, form.trainingDate);
  const fitnessCap = fitness ? (fitness.canTrain ? fitness.maxAllowedIntensity : null) : undefined; // undefined = chưa biết
  const intensityCap = phase ? (fitnessCap === undefined ? phase.intensityLevel : lowerIntensity(phase.intensityLevel, fitnessCap)) : null;
  const typeAllowed = (type) => Boolean(phase) && fitnessCap !== null && intensityRank(type.intensityLevel) <= intensityRank(intensityCap);
  const selectedType = options.trainingTypes.find((t) => t.code === form.trainingType);
  const isSwimming = form.trainingType === SWIMMING_TYPE;
  const backTo = location.state?.from ?? (plan ? `/trainer/plans/${plan.planId}` : "/trainer/plans");

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Chọn bài tập: điền cự ly / thời lượng theo giai đoạn nếu còn trống; Bơi ⇔ Hồ bơi
  const handleTypeChange = (e) => {
    const code = e.target.value;
    setForm((prev) => ({
      ...prev,
      trainingType: code,
      distanceKm: prev.distanceKm || (phase ? String(phase.targetDistanceKm) : ""),
      durationMinutes: prev.durationMinutes || (phase ? String(phase.sessionDurationMinutes) : ""),
      surface: code === SWIMMING_TYPE ? POOL_SURFACE : prev.surface === POOL_SURFACE ? "" : prev.surface,
    }));
    setErrors((prev) => ({ ...prev, trainingType: undefined, surface: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!DATE_PATTERN.test(form.trainingDate)) newErrors.trainingDate = "Chọn ngày tập";
    else if (form.trainingDate < todayISO()) newErrors.trainingDate = "Ngày tập không được ở quá khứ";
    else if (!phase) newErrors.trainingDate = "Ngày tập phải nằm trong một giai đoạn của giáo án";
    if (form.startTime && !TIME_PATTERN.test(form.startTime)) newErrors.startTime = "Giờ dạng HH:mm";
    if (!form.trainingType) newErrors.trainingType = "Chọn loại bài tập";
    else if (selectedType && phase && fitnessCap !== undefined && !typeAllowed(selectedType)) {
      newErrors.trainingType = fitnessCap === null ? "Ngựa hiện không được phép tập" : `Vượt cường độ cho phép (${label("intensityLevels", intensityCap)})`;
    }
    const distance = Number(form.distanceKm);
    if (form.distanceKm === "" || !(distance > 0) || distance > SESSION_RULES.distanceKmMax) {
      newErrors.distanceKm = `Lớn hơn 0, tối đa ${SESSION_RULES.distanceKmMax} km`;
    }
    const { min, max } = SESSION_RULES.durationMinutes;
    const minutes = Number(form.durationMinutes);
    if (form.durationMinutes === "" || !Number.isInteger(minutes) || minutes < min || minutes > max) {
      newErrors.durationMinutes = `Từ ${min} đến ${max} phút`;
    }
    if (form.surface === POOL_SURFACE && !isSwimming) newErrors.surface = "Hồ bơi chỉ dùng cho bài Bơi";
    if (form.sessionTitle.trim().length > SESSION_RULES.titleMax) newErrors.sessionTitle = `Tối đa ${SESSION_RULES.titleMax} ký tự`;
    if (form.notes.trim().length > SESSION_RULES.notesMax) newErrors.notes = `Tối đa ${SESSION_RULES.notesMax} ký tự`;
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
    setSubmitError(null);
    const body = {
      trainingDate: form.trainingDate,
      startTime: form.startTime || null,
      trainingType: form.trainingType,
      distanceKm: Number(form.distanceKm),
      durationMinutes: Number(form.durationMinutes),
      surface: form.surface || null,
      sessionTitle: form.sessionTitle.trim() || null,
      notes: form.notes.trim() || null,
      assignedToUserId: form.assignee ? Number(form.assignee) : null,
    };
    try {
      const saved = isEdit ? await updateTrainingSession(id, body) : await addPlanSession(plan.planId, body);
      const when = `${weekdayName(saved.trainingDate)} ${formatDate(saved.trainingDate)}`;
      navigate(backTo, {
        state: { message: isEdit ? `Đã cập nhật buổi "${saved.sessionTitle}" (${when}).` : `Đã thêm buổi "${saved.sessionTitle}" vào ${when}.` },
      });
    } catch (err) {
      setSubmitError(err);
      setSubmitting(false);
    }
  };

  // Thử lại sau lỗi tải: hiện màn chờ ngay rồi gọi lại (effect phía trên chạy lại theo reloadKey)
  const retryLoad = () => {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  };

  if (loading) return <LoadingState />;
  if (loadError) return <ApiErrorNotice variant="page" error={loadError} onRetry={retryLoad} />;

  const blockedReason =
    plan.status !== "Active"
      ? `Giáo án "${plan.planName}" đang ở trạng thái ${label("planStatuses", plan.status)} — chỉ xếp buổi tập cho giáo án đang áp dụng.`
      : isEdit && session.status !== "Scheduled"
        ? `Buổi tập đã ${label("sessionStatuses", session.status).toLowerCase()} nên không sửa được nữa.`
        : "";
  if (blockedReason) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
          {isEdit ? "Không thể sửa buổi tập" : "Không thể thêm buổi tập"}
        </h1>
        <p className="mt-2 text-stone">{blockedReason}</p>
        <Link to={backTo} className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại
        </Link>
      </div>
    );
  }

  const defaultTitle = phase && selectedType ? `${phase.phaseName} - ${selectedType.label}` : "";
  const today = todayISO();

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={backTo} className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isEdit ? "Sửa buổi tập" : "Thêm buổi tập"}
      </h1>
      <p className="mt-1 text-sm text-stone">
        {plan.horseName} · {plan.planName}
      </p>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <form onSubmit={handleSubmit} noValidate className="space-y-5 border-t border-stone/20 pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              variant="outline"
              label="Ngày tập"
              id="trainingDate"
              type="date"
              min={plan.startDate > today ? plan.startDate : today}
              max={plan.endDate}
              value={form.trainingDate}
              onChange={(e) => setField("trainingDate", e.target.value)}
              error={errors.trainingDate}
            />
            <FormField
              variant="outline"
              label="Giờ bắt đầu"
              id="startTime"
              type="time"
              value={form.startTime}
              onChange={(e) => setField("startTime", e.target.value)}
              error={errors.startTime}
            />
          </div>

          <SelectField
            variant="outline"
            label="Loại bài tập"
            id="trainingType"
            value={form.trainingType}
            onChange={handleTypeChange}
            error={errors.trainingType}
          >
            <option value="">Chọn bài tập</option>
            {options.trainingTypes.map((type) => {
              const blocked = fitnessCap !== undefined && !typeAllowed(type);
              return (
                <option key={type.code} value={type.code} disabled={blocked}>
                  {type.label} — {label("intensityLevels", type.intensityLevel)}
                  {blocked ? (phase ? " (vượt mức cho phép)" : " (ngày chưa thuộc giai đoạn nào)") : ""}
                </option>
              );
            })}
          </SelectField>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField
              variant="outline"
              label="Cự ly"
              id="distanceKm"
              type="number"
              inputMode="decimal"
              min="0.1"
              max={SESSION_RULES.distanceKmMax}
              step="0.1"
              suffix="km"
              value={form.distanceKm}
              onChange={(e) => setField("distanceKm", e.target.value)}
              error={errors.distanceKm}
            />
            <FormField
              variant="outline"
              label="Thời lượng"
              id="durationMinutes"
              type="number"
              inputMode="numeric"
              min={SESSION_RULES.durationMinutes.min}
              max={SESSION_RULES.durationMinutes.max}
              step="5"
              suffix="phút"
              value={form.durationMinutes}
              onChange={(e) => setField("durationMinutes", e.target.value)}
              error={errors.durationMinutes}
            />
            <SelectField
              variant="outline"
              label="Mặt sân"
              id="surface"
              value={form.surface}
              onChange={(e) => setField("surface", e.target.value)}
              disabled={isSwimming}
              error={errors.surface}
            >
              <option value="">Mặc định</option>
              {options.surfaces
                .filter((surface) => (isSwimming ? surface.code === POOL_SURFACE : surface.code !== POOL_SURFACE))
                .map((surface) => (
                  <option key={surface.code} value={surface.code}>
                    {surface.label}
                  </option>
                ))}
            </SelectField>
          </div>
          {!isSwimming && (
            <p className="-mt-2 text-xs text-stone">
              Mặc định: mặt sân của giai đoạn nếu hợp với bài tập, không thì theo bài tập
              {selectedType?.defaultSurface && ` (${label("surfaces", selectedType.defaultSurface)})`}.
            </p>
          )}

          <FormField
            variant="outline"
            label="Tiêu đề (không bắt buộc)"
            id="sessionTitle"
            value={form.sessionTitle}
            maxLength={SESSION_RULES.titleMax}
            placeholder={defaultTitle || "Mặc định: <giai đoạn> - <bài tập>"}
            onChange={(e) => setField("sessionTitle", e.target.value)}
            error={errors.sessionTitle}
          />
          <TextAreaField
            label="Ghi chú / dặn dò"
            id="notes"
            rows={2}
            value={form.notes}
            maxLength={SESSION_RULES.notesMax}
            placeholder="VD: Sau buổi bơi kiểm tra móng"
            onChange={(e) => setField("notes", e.target.value)}
            error={errors.notes}
          />
          <div className="sm:max-w-sm">
            <SelectField
              variant="outline"
              label="Người phụ trách"
              id="assignee"
              value={form.assignee}
              onChange={(e) => setField("assignee", e.target.value)}
            >
              <option value="">Chưa phân công</option>
              {staff.map((person) => (
                <option key={person.userId} value={person.userId}>
                  {person.fullName}
                  {person.roleId === "head_trainer" ? " (HLV)" : ""}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="space-y-4 border-t border-stone/20 pt-5">
            <ApiErrorNotice error={submitError} />
            <div className="flex items-center justify-end gap-5">
              <Link to={backTo} className="text-sm font-medium text-stone underline-offset-2 hover:text-ink hover:underline">
                Hủy
              </Link>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm buổi tập"}
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-lg border border-stone/15 bg-white px-5 py-4">
            <p className="text-xs font-medium text-stone">Giai đoạn của ngày tập</p>
            {phase ? (
              <>
                <p className="mt-1 font-serif text-base font-semibold text-ink">{phase.phaseName}</p>
                <p className="text-xs text-stone">
                  {formatDate(phase.startDate)} – {formatDate(phase.endDate)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink">
                  <TrainingBadge kind="intensity" code={phase.intensityLevel}>
                    Tối đa {label("intensityLevels", phase.intensityLevel).toLowerCase()}
                  </TrainingBadge>
                  <span>
                    {formatKm(phase.targetDistanceKm)} · {formatMinutes(phase.sessionDurationMinutes)}
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-stone">Ngày đã chọn không thuộc giai đoạn nào của giáo án.</p>
            )}
            <p className="mt-3 text-xs text-stone">Mỗi ngựa tối đa {SESSION_RULES.maxPerDay} buổi tập mỗi ngày.</p>
          </div>
          <div className="rounded-lg border border-stone/15 bg-white px-5 py-5">
            <HorseFitnessPanel
              fitness={fitness}
              loading={fitnessState.loading}
              error={fitnessState.error}
              onRefresh={fitnessState.reload}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
