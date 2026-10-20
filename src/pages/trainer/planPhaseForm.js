// Chuyển đổi + kiểm tra giai đoạn giáo án giữa ô nhập (chuỗi) và body API (số / null).
// Quy tắc khớp BE (SWP.Application/Training/TrainingValidation.cs) để báo lỗi ngay trên form.
import { PLAN_RULES } from "../../data/trainingCodes";
import { addDays, daysBetween, todayISO } from "../../utils/date";
import { isIntensityAllowed, lowerIntensity, nextMondayISO } from "../../utils/trainingFormat";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_PHASE_DAYS = 14;

let keySeed = 0;
const nextKey = () => {
  keySeed += 1;
  return `phase-${keySeed}`;
};

const toInput = (value) => (value === null || value === undefined ? "" : String(value));

// Giai đoạn của API (TrainingPhase, hoặc phases của gợi ý giáo án) → giá trị ô nhập
export function phaseToForm(phase) {
  return {
    key: nextKey(),
    phaseName: phase.phaseName ?? "",
    goal: phase.goal ?? "",
    startDate: phase.startDate ?? "",
    endDate: phase.endDate ?? "",
    intensityLevel: phase.intensityLevel ?? "",
    sessionsPerWeek: toInput(phase.sessionsPerWeek),
    targetDistanceKm: toInput(phase.targetDistanceKm),
    sessionDurationMinutes: toInput(phase.sessionDurationMinutes),
    surface: phase.surface ?? "",
  };
}

// Giai đoạn mới nối tiếp giai đoạn trước (2 tuần), giữ thông số của giai đoạn trước nhưng không vượt mức thể trạng
export function createPhase(previous, maxIntensity) {
  const startDate = DATE_PATTERN.test(previous?.endDate ?? "") ? addDays(previous.endDate, 1) : nextMondayISO();
  return {
    key: nextKey(),
    phaseName: "",
    goal: "",
    startDate,
    endDate: addDays(startDate, DEFAULT_PHASE_DAYS - 1),
    intensityLevel: lowerIntensity(previous?.intensityLevel || "Low", maxIntensity),
    sessionsPerWeek: previous?.sessionsPerWeek || "4",
    targetDistanceKm: previous?.targetDistanceKm || "3",
    sessionDurationMinutes: previous?.sessionDurationMinutes || "35",
    surface: previous?.surface ?? "",
  };
}

export function phaseToPayload(phase) {
  return {
    phaseName: phase.phaseName.trim(),
    goal: phase.goal.trim() || null,
    startDate: phase.startDate,
    endDate: phase.endDate,
    intensityLevel: phase.intensityLevel,
    sessionsPerWeek: Number(phase.sessionsPerWeek),
    targetDistanceKm: Number(phase.targetDistanceKm),
    sessionDurationMinutes: Number(phase.sessionDurationMinutes),
    surface: phase.surface || null,
  };
}

function validatePhase(phase, today, maxIntensity, intensityLabel) {
  const errors = {};
  const name = phase.phaseName.trim();
  if (!name) errors.phaseName = "Vui lòng nhập tên giai đoạn";
  else if (name.length > PLAN_RULES.phaseNameMax) errors.phaseName = `Tối đa ${PLAN_RULES.phaseNameMax} ký tự`;
  if (phase.goal.trim().length > PLAN_RULES.phaseGoalMax) errors.goal = `Tối đa ${PLAN_RULES.phaseGoalMax} ký tự`;

  if (!DATE_PATTERN.test(phase.startDate)) errors.startDate = "Chọn ngày bắt đầu";
  else if (phase.startDate < today) errors.startDate = "Không được bắt đầu trong quá khứ";
  if (!DATE_PATTERN.test(phase.endDate)) errors.endDate = "Chọn ngày kết thúc";
  else if (DATE_PATTERN.test(phase.startDate) && phase.endDate < phase.startDate) errors.endDate = "Phải sau hoặc bằng ngày bắt đầu";

  if (!phase.intensityLevel) errors.intensityLevel = "Chọn cường độ";
  else if (maxIntensity && !isIntensityAllowed(phase.intensityLevel, maxIntensity)) {
    errors.intensityLevel = `Vượt mức thể trạng cho phép (${intensityLabel(maxIntensity)})`;
  }

  const { min: minSessions, max: maxSessions } = PLAN_RULES.sessionsPerWeek;
  const sessions = Number(phase.sessionsPerWeek);
  if (phase.sessionsPerWeek === "" || !Number.isInteger(sessions) || sessions < minSessions || sessions > maxSessions) {
    errors.sessionsPerWeek = `Từ ${minSessions} đến ${maxSessions} buổi`;
  }
  const distance = Number(phase.targetDistanceKm);
  if (phase.targetDistanceKm === "" || !(distance > 0) || distance > PLAN_RULES.distanceKmMax) {
    errors.targetDistanceKm = `Lớn hơn 0, tối đa ${PLAN_RULES.distanceKmMax} km`;
  }
  const { min: minMinutes, max: maxMinutes } = PLAN_RULES.durationMinutes;
  const minutes = Number(phase.sessionDurationMinutes);
  if (phase.sessionDurationMinutes === "" || !Number.isInteger(minutes) || minutes < minMinutes || minutes > maxMinutes) {
    errors.sessionDurationMinutes = `Từ ${minMinutes} đến ${maxMinutes} phút`;
  }
  return errors;
}

// Kiểm tra cả danh sách giai đoạn. maxIntensity: mức trần theo thể trạng (trống = chưa biết, để BE kiểm tra).
// Trả { phaseErrors: [{ field: message }] theo thứ tự giai đoạn, formError: lỗi chung | null }
export function validatePhases(phases, { maxIntensity, intensityLabel }) {
  const today = todayISO();
  const phaseErrors = phases.map((phase) => validatePhase(phase, today, maxIntensity, intensityLabel));

  if (phases.length === 0) return { phaseErrors, formError: "Giáo án phải có ít nhất một giai đoạn." };
  if (phases.length > PLAN_RULES.maxPhases) {
    return { phaseErrors, formError: `Giáo án tối đa ${PLAN_RULES.maxPhases} giai đoạn.` };
  }

  // Không trùng ngày: xếp theo ngày bắt đầu, giai đoạn sau phải bắt đầu sau ngày kết thúc của giai đoạn trước
  const dated = phases
    .map((phase, index) => ({ ...phase, index }))
    .filter((phase) => !phaseErrors[phase.index].startDate && !phaseErrors[phase.index].endDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (let i = 1; i < dated.length; i += 1) {
    if (dated[i].startDate <= dated[i - 1].endDate) {
      phaseErrors[dated[i].index].startDate = `Trùng ngày với giai đoạn ${dated[i - 1].index + 1}`;
    }
  }

  let formError = null;
  if (dated.length > 0) {
    const lastEnd = dated.reduce((max, phase) => (phase.endDate > max ? phase.endDate : max), dated[0].endDate);
    if (daysBetween(dated[0].startDate, lastEnd) + 1 > PLAN_RULES.maxTotalDays) {
      formError = `Giáo án kéo dài tối đa ${PLAN_RULES.maxTotalDays} ngày.`;
    }
  }
  return { phaseErrors, formError };
}

export const hasPhaseErrors = (phaseErrors) => phaseErrors.some((errors) => Object.keys(errors).length > 0);
