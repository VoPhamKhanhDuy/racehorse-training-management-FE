import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import TextAreaField from "../../components/TextAreaField";
import HorseFitnessPanel from "./HorseFitnessPanel";
import PlanPhaseEditor from "./PlanPhaseEditor";
import PlanPhaseTable from "./PlanPhaseTable";
import { createPhase, hasPhaseErrors, phaseToForm, phaseToPayload, validatePhases } from "./planPhaseForm";
import { PLAN_RULES } from "../../data/trainingCodes";
import useHorseFitness from "../../hooks/useHorseFitness";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import {
  createTrainingPlan,
  getHorses,
  getPlanSuggestion,
  getTrainingPlan,
  updateTrainingPlan,
} from "../../services/trainingApi";
import { formatDate, todayISO } from "../../utils/date";
import { nextMondayISO } from "../../utils/trainingFormat";

const emptyForm = { horseId: "", planName: "", objective: "", trainingType: "", notes: "" };
const SECTION_TITLE = "font-serif text-lg font-semibold text-ink";

// Lập giáo án (/trainer/plans/new, ?horse= điền sẵn ngựa) và sửa giáo án (/trainer/plans/:id/edit).
// - Bên phải: thể trạng hiện tại của ngựa → mức cường độ tối đa; giai đoạn vượt mức bị chặn ngay trên form (BE trả 422).
// - "Gợi ý theo thể trạng": điền sẵn các giai đoạn từ API gợi ý, HLV chỉnh lại trước khi lưu.
// - Giáo án Nháp sửa được cả giai đoạn; đang áp dụng chỉ sửa thông tin chung; đã kết thúc / hủy thì không sửa được.
export default function TrainingPlanForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { options, label } = useTrainingOptions();

  const [horses, setHorses] = useState([]);
  const [plan, setPlan] = useState(null); // giáo án đang sửa
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState(emptyForm);
  const [phases, setPhases] = useState([]);
  const [errors, setErrors] = useState({ phases: [] });
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [suggestStart, setSuggestStart] = useState(nextMondayISO);
  const [suggestWeeks, setSuggestWeeks] = useState(String(PLAN_RULES.suggestionWeeks.default));
  const [suggestion, setSuggestion] = useState(null);
  const [suggestError, setSuggestError] = useState(null);
  const [suggesting, setSuggesting] = useState(false);

  const fitnessState = useHorseFitness(form.horseId);
  const fitness = fitnessState.fitness;
  const maxIntensity = fitness?.canTrain ? fitness.maxAllowedIntensity : null;
  const phasesEditable = !isEdit || plan?.status === "Draft";

  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), isEdit ? getTrainingPlan(id) : Promise.resolve(null)])
      .then(([horseList, planDetail]) => {
        if (ignore) return;
        setHorses(horseList);
        if (planDetail) {
          setPlan(planDetail);
          setForm({
            horseId: String(planDetail.horseId),
            planName: planDetail.planName ?? "",
            objective: planDetail.objective ?? "",
            trainingType: planDetail.trainingType ?? "",
            notes: planDetail.notes ?? "",
          });
          setPhases(planDetail.phases.map(phaseToForm));
        } else {
          const horseParam = searchParams.get("horse");
          const validHorse = horseList.some((h) => String(h.horseId) === horseParam);
          setForm({ ...emptyForm, horseId: validHorse ? horseParam : "" });
          setPhases([createPhase(null, null)]);
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
  }, [id, isEdit, searchParams, reloadKey]);

  const selectedHorse = horses.find((h) => String(h.horseId) === form.horseId);
  const backTo = isEdit ? `/trainer/plans/${id}` : "/trainer/plans";

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleHorseChange = (e) => {
    setField("horseId", e.target.value);
    setSuggestion(null);
    setSuggestError(null);
  };

  const handlePhaseChange = (index, field, value) => {
    setPhases((prev) => prev.map((phase, i) => (i === index ? { ...phase, [field]: value } : phase)));
    setErrors((prev) => ({
      ...prev,
      phasesForm: undefined,
      phases: prev.phases.map((phaseErrors, i) => (i === index ? { ...phaseErrors, [field]: undefined } : phaseErrors)),
    }));
  };

  const handleAddPhase = () => {
    setPhases((prev) => [...prev, createPhase(prev[prev.length - 1], maxIntensity)]);
  };

  const handleRemovePhase = (index) => {
    setPhases((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, phasesForm: undefined, phases: prev.phases.filter((_, i) => i !== index) }));
  };

  // Gợi ý giáo án theo thể trạng → thay các giai đoạn đang nhập, điền tên + loại giáo án nếu còn trống
  const handleSuggest = async () => {
    if (!form.horseId) {
      setErrors((prev) => ({ ...prev, horseId: "Chọn ngựa trước khi lấy gợi ý" }));
      return;
    }
    const weeks = Number(suggestWeeks);
    const { min, max } = PLAN_RULES.suggestionWeeks;
    if (!Number.isInteger(weeks) || weeks < min || weeks > max) {
      setSuggestError({ message: `Số tuần phải từ ${min} đến ${max}.` });
      return;
    }
    if (!suggestStart || suggestStart < todayISO()) {
      setSuggestError({ message: "Ngày bắt đầu không được ở quá khứ." });
      return;
    }
    setSuggesting(true);
    setSuggestError(null);
    try {
      const result = await getPlanSuggestion(form.horseId, { startDate: suggestStart, weeks });
      setSuggestion(result);
      if (result.canCreatePlan && result.phases.length > 0) {
        setPhases(result.phases.map(phaseToForm));
        setForm((prev) => ({
          ...prev,
          planName: prev.planName.trim() ? prev.planName : result.suggestedPlanName ?? "",
          trainingType: prev.trainingType || result.suggestedTrainingType || "",
        }));
        setErrors((prev) => ({ ...prev, planName: undefined, phases: [], phasesForm: undefined }));
      }
    } catch (err) {
      setSuggestError(err);
    } finally {
      setSuggesting(false);
    }
  };

  const validate = () => {
    const newErrors = { phases: [] };
    if (!form.horseId) newErrors.horseId = "Vui lòng chọn ngựa";
    const name = form.planName.trim();
    if (!name) newErrors.planName = "Vui lòng nhập tên giáo án";
    else if (name.length > PLAN_RULES.planNameMax) newErrors.planName = `Tối đa ${PLAN_RULES.planNameMax} ký tự`;
    if (form.objective.trim().length > PLAN_RULES.objectiveMax) newErrors.objective = `Tối đa ${PLAN_RULES.objectiveMax} ký tự`;
    if (form.notes.trim().length > PLAN_RULES.notesMax) newErrors.notes = `Tối đa ${PLAN_RULES.notesMax} ký tự`;
    if (phasesEditable) {
      const { phaseErrors, formError } = validatePhases(phases, {
        maxIntensity,
        intensityLabel: (code) => label("intensityLevels", code),
      });
      newErrors.phases = phaseErrors;
      if (formError) newErrors.phasesForm = formError;
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    const { phases: phaseErrors, ...fieldErrors } = newErrors;
    if (Object.values(fieldErrors).some(Boolean) || hasPhaseErrors(phaseErrors)) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const body = {
      planName: form.planName.trim(),
      objective: form.objective.trim() || null,
      trainingType: form.trainingType || null,
      notes: form.notes.trim() || null,
      // Giáo án không còn Nháp: null = giữ nguyên giai đoạn
      phases: phasesEditable ? phases.map(phaseToPayload) : null,
    };
    try {
      const saved = isEdit ? await updateTrainingPlan(id, body) : await createTrainingPlan({ horseId: Number(form.horseId), ...body });
      navigate(`/trainer/plans/${saved.planId}`, {
        state: {
          message: isEdit
            ? `Đã cập nhật giáo án "${saved.planName}".`
            : `Đã lập giáo án "${saved.planName}" ở trạng thái Nháp. Xem trước lịch tuần rồi bấm Áp dụng để bắt đầu.`,
        },
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

  if (isEdit && plan && !["Draft", "Active"].includes(plan.status)) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Không thể sửa giáo án</h1>
        <p className="mt-2 text-stone">
          Giáo án "{plan.planName}" đã {label("planStatuses", plan.status).toLowerCase()} nên không sửa được nữa.
        </p>
        <Link to={backTo} className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại giáo án
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to={backTo} className="text-sm font-medium text-brass-deep hover:underline">
        ← {isEdit ? "Quay lại giáo án" : "Quay lại danh sách"}
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isEdit ? "Sửa giáo án" : "Lập giáo án mới"}
      </h1>

      {/* 2 cột: form bên trái, thể trạng ngựa bên phải (dính khi cuộn). Dưới lg thể trạng lên trên form. */}
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <form onSubmit={handleSubmit} noValidate className="order-2 space-y-8 lg:order-1">
          <section className="space-y-5 border-t border-stone/20 pt-6">
            <h2 className={SECTION_TITLE}>Thông tin chung</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                variant="outline"
                label="Ngựa"
                id="horseId"
                value={form.horseId}
                onChange={handleHorseChange}
                disabled={isEdit}
                error={errors.horseId}
              >
                <option value="">Chọn ngựa</option>
                {horses.map((horse) => (
                  <option key={horse.horseId} value={horse.horseId}>
                    {horse.name}
                    {horse.breed ? ` — ${horse.breed}` : ""}
                  </option>
                ))}
              </SelectField>
              <SelectField
                variant="outline"
                label="Loại giáo án"
                id="trainingType"
                value={form.trainingType}
                onChange={(e) => setField("trainingType", e.target.value)}
              >
                <option value="">Không chọn</option>
                {options.planTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <FormField
              variant="outline"
              label="Tên giáo án"
              id="planName"
              value={form.planName}
              maxLength={PLAN_RULES.planNameMax}
              placeholder="VD: Giáo án chuẩn bị giải mùa đông"
              onChange={(e) => setField("planName", e.target.value)}
              error={errors.planName}
            />
            <TextAreaField
              label="Mục tiêu"
              id="objective"
              rows={2}
              value={form.objective}
              maxLength={PLAN_RULES.objectiveMax}
              placeholder="VD: Chuẩn bị cho giải đua tháng 12"
              onChange={(e) => setField("objective", e.target.value)}
              error={errors.objective}
            />
            <TextAreaField
              label="Ghi chú"
              id="notes"
              rows={2}
              value={form.notes}
              maxLength={PLAN_RULES.notesMax}
              placeholder="VD: Theo dõi nhịp tim sau mỗi buổi phi nước đại"
              onChange={(e) => setField("notes", e.target.value)}
              error={errors.notes}
            />
          </section>

          {phasesEditable && (
            <section className="rounded-lg border border-brass/30 bg-brass/5 px-4 py-4 sm:px-5">
              <h2 className="flex items-center gap-2 font-serif text-base font-semibold text-ink">
                <Sparkles className="h-4 w-4 text-brass-deep" aria-hidden="true" />
                Gợi ý theo thể trạng
              </h2>
              <p className="mt-1 text-sm text-stone">
                Hệ thống chia giai đoạn theo mức cường độ khuyến nghị của ngựa. Các giai đoạn đang nhập bên dưới sẽ được thay bằng gợi
                ý.
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-4">
                <div className="w-44">
                  <FormField
                    variant="outline"
                    label="Bắt đầu từ"
                    id="suggestStart"
                    type="date"
                    min={todayISO()}
                    value={suggestStart}
                    onChange={(e) => setSuggestStart(e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <FormField
                    variant="outline"
                    label="Số tuần"
                    id="suggestWeeks"
                    type="number"
                    inputMode="numeric"
                    min={PLAN_RULES.suggestionWeeks.min}
                    max={PLAN_RULES.suggestionWeeks.max}
                    value={suggestWeeks}
                    onChange={(e) => setSuggestWeeks(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={suggesting}
                  className="h-[46px] cursor-pointer rounded-md border border-brass-deep/40 bg-white px-4 text-sm font-semibold text-brass-deep transition-colors hover:border-brass-deep hover:bg-brass/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {suggesting ? "Đang gợi ý..." : "Lấy gợi ý"}
                </button>
              </div>
              {suggestError && (
                <div className="mt-3">
                  <ApiErrorNotice error={suggestError} />
                </div>
              )}
              {suggestion && (
                <div className="mt-3 text-sm">
                  {suggestion.canCreatePlan ? (
                    <p className="text-green-800">
                      Đã điền {suggestion.phases.length} giai đoạn
                      {suggestion.endDate && ` từ ${formatDate(suggestion.startDate)} đến ${formatDate(suggestion.endDate)}`}
                      {suggestion.suggestedTrainingType && ` (${label("planTypes", suggestion.suggestedTrainingType)})`} — có thể chỉnh lại
                      trước khi lưu.
                    </p>
                  ) : (
                    <p className="text-alert">Ngựa hiện không được phép tập nên chưa thể lập giáo án.</p>
                  )}
                  {suggestion.rationale?.length > 0 && (
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-stone">
                      {suggestion.rationale.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="space-y-4 border-t border-stone/20 pt-6">
            <div>
              <h2 className={SECTION_TITLE}>Các giai đoạn</h2>
              <p className="mt-1 text-sm text-stone">
                {phasesEditable
                  ? `Tối đa ${PLAN_RULES.maxPhases} giai đoạn, không trùng ngày, cả giáo án không quá ${PLAN_RULES.maxTotalDays} ngày.`
                  : "Giáo án đang áp dụng: chỉ sửa được thông tin chung, các giai đoạn giữ nguyên."}
              </p>
            </div>
            {errors.phasesForm && <p className="text-sm text-alert">{errors.phasesForm}</p>}
            {phasesEditable ? (
              <PlanPhaseEditor
                phases={phases}
                errors={errors.phases}
                maxIntensity={maxIntensity}
                onChange={handlePhaseChange}
                onAdd={handleAddPhase}
                onRemove={handleRemovePhase}
              />
            ) : (
              <PlanPhaseTable phases={plan?.phases} markCurrent />
            )}
          </section>

          <div className="space-y-4 border-t border-stone/20 pt-5">
            <ApiErrorNotice error={submitError} />
            <div className="flex items-center justify-end gap-5">
              <Link to={backTo} className="text-sm font-medium text-stone underline-offset-2 hover:text-ink hover:underline">
                Hủy
              </Link>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Lập giáo án (Nháp)"}
              </button>
            </div>
          </div>
        </form>

        <aside className="order-1 rounded-lg border border-stone/15 bg-white px-5 py-5 lg:sticky lg:top-24 lg:order-2">
          <HorseFitnessPanel
            fitness={fitness}
            loading={fitnessState.loading}
            error={fitnessState.error}
            onRefresh={selectedHorse ? fitnessState.reload : undefined}
          />
        </aside>
      </div>
    </div>
  );
}
