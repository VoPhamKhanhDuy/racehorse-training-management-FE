import { Plus } from "lucide-react";
import FormField from "../../components/FormField";
import SelectField from "../../components/SelectField";
import { PLAN_RULES } from "../../data/trainingCodes";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { daysBetween, formatDate, todayISO } from "../../utils/date";
import { isIntensityAllowed } from "../../utils/trainingFormat";

// Nhập các giai đoạn của giáo án (1–12, không trùng ngày, được có tuần nghỉ xen giữa).
// phases: giá trị ô nhập (xem planPhaseForm.js); errors: lỗi theo từng giai đoạn.
// maxIntensity: mức trần theo thể trạng — cường độ vượt mức bị khóa trong danh sách chọn.
export default function PlanPhaseEditor({ phases, errors = [], maxIntensity, onChange, onAdd, onRemove }) {
  const { options, label } = useTrainingOptions();
  const today = todayISO();

  return (
    <div className="space-y-4">
      {phases.map((phase, index) => {
        const phaseErrors = errors[index] ?? {};
        const fieldId = (field) => `${phase.key}-${field}`;
        const update = (field) => (e) => onChange(index, field, e.target.value);
        const days =
          phase.startDate && phase.endDate && phase.endDate >= phase.startDate ? daysBetween(phase.startDate, phase.endDate) + 1 : null;

        return (
          <fieldset key={phase.key} className="rounded-lg border border-stone/15 bg-white px-4 py-4 sm:px-5">
            <legend className="sr-only">Giai đoạn {index + 1}</legend>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-serif text-base font-semibold text-ink">
                Giai đoạn {index + 1}
                {days && (
                  <span className="ml-2 font-sans text-xs font-normal text-stone">
                    {formatDate(phase.startDate)} – {formatDate(phase.endDate)} · {days} ngày
                  </span>
                )}
              </p>
              {phases.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="cursor-pointer text-sm font-medium text-stone underline-offset-2 hover:text-alert hover:underline"
                >
                  Xóa giai đoạn
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                variant="outline"
                label="Tên giai đoạn"
                id={fieldId("name")}
                value={phase.phaseName}
                maxLength={PLAN_RULES.phaseNameMax}
                placeholder="VD: Nền tảng thể lực"
                onChange={update("phaseName")}
                error={phaseErrors.phaseName}
              />
              <FormField
                variant="outline"
                label="Mục tiêu (không bắt buộc)"
                id={fieldId("goal")}
                value={phase.goal}
                maxLength={PLAN_RULES.phaseGoalMax}
                placeholder="VD: Xây dựng sức bền nền"
                onChange={update("goal")}
                error={phaseErrors.goal}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                variant="outline"
                label="Từ ngày"
                id={fieldId("start")}
                type="date"
                min={today}
                value={phase.startDate}
                onChange={update("startDate")}
                error={phaseErrors.startDate}
              />
              <FormField
                variant="outline"
                label="Đến ngày"
                id={fieldId("end")}
                type="date"
                min={phase.startDate || today}
                value={phase.endDate}
                onChange={update("endDate")}
                error={phaseErrors.endDate}
              />
              <SelectField
                variant="outline"
                label="Cường độ tối đa"
                id={fieldId("intensity")}
                value={phase.intensityLevel}
                onChange={update("intensityLevel")}
                error={phaseErrors.intensityLevel}
              >
                <option value="">Chọn cường độ</option>
                {options.intensityLevels.map((level) => {
                  const blocked = Boolean(maxIntensity) && !isIntensityAllowed(level.code, maxIntensity);
                  return (
                    <option key={level.code} value={level.code} disabled={blocked}>
                      {level.label}
                      {blocked ? " — vượt thể trạng" : ""}
                    </option>
                  );
                })}
              </SelectField>
              <FormField
                variant="outline"
                label="Số buổi / tuần"
                id={fieldId("sessions")}
                type="number"
                inputMode="numeric"
                min={PLAN_RULES.sessionsPerWeek.min}
                max={PLAN_RULES.sessionsPerWeek.max}
                step="1"
                value={phase.sessionsPerWeek}
                onChange={update("sessionsPerWeek")}
                error={phaseErrors.sessionsPerWeek}
              />
              <FormField
                variant="outline"
                label="Cự ly mỗi buổi"
                id={fieldId("distance")}
                type="number"
                inputMode="decimal"
                min="0.1"
                max={PLAN_RULES.distanceKmMax}
                step="0.1"
                suffix="km"
                value={phase.targetDistanceKm}
                onChange={update("targetDistanceKm")}
                error={phaseErrors.targetDistanceKm}
              />
              <FormField
                variant="outline"
                label="Thời lượng mỗi buổi"
                id={fieldId("duration")}
                type="number"
                inputMode="numeric"
                min={PLAN_RULES.durationMinutes.min}
                max={PLAN_RULES.durationMinutes.max}
                step="5"
                suffix="phút"
                value={phase.sessionDurationMinutes}
                onChange={update("sessionDurationMinutes")}
                error={phaseErrors.sessionDurationMinutes}
              />
              <SelectField
                variant="outline"
                label="Mặt sân ưu tiên"
                id={fieldId("surface")}
                value={phase.surface}
                onChange={update("surface")}
              >
                <option value="">Theo loại bài tập</option>
                {/* Hồ bơi chỉ dùng cho bài Bơi — không đặt cho cả giai đoạn (trừ dữ liệu cũ đã chọn) */}
                {options.surfaces
                  .filter((surface) => surface.code !== "Pool" || phase.surface === "Pool")
                  .map((surface) => (
                    <option key={surface.code} value={surface.code}>
                      {surface.label}
                    </option>
                  ))}
              </SelectField>
            </div>
            {phase.intensityLevel && (
              <p className="mt-3 text-xs text-stone">
                Lịch tuần xen kẽ buổi nhẹ và buổi chính theo cường độ {label("intensityLevels", phase.intensityLevel).toLowerCase()}; Chủ
                Nhật luôn nghỉ.
              </p>
            )}
          </fieldset>
        );
      })}

      {phases.length < PLAN_RULES.maxPhases && (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone/30 bg-white/60 py-3 text-sm font-medium text-brass-deep transition-colors hover:border-brass hover:bg-brass/5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm giai đoạn
        </button>
      )}
    </div>
  );
}
