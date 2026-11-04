// API thật cho luồng Lập & Thực hiện giáo án huấn luyện (BE: docs/API_GiaoAn_HuanLuyen.md).
// /api/trainer/** chỉ cho head_trainer; /api/training-assignments/me cho groom + head_trainer.
// Ngày dạng "yyyy-MM-dd", giờ "HH:mm"; dữ liệu trả về giữ nguyên field camelCase của BE.
// Khác trainerService.js (mock): các màn khác (Chủ ngựa, Quản lý, Bác sĩ) vẫn đọc mock cho tới khi có API tương ứng.
import { apiRequest } from "./apiClient";

const TRAINER = "/api/trainer";
const PLANS = `${TRAINER}/training-plans`;
const SESSIONS = `${TRAINER}/training-sessions`;

// ---- Ngựa (GET /api/horses — mọi role đã đăng nhập) ----

// HorseDto của BE giữ tên field theo mock (HorseID, Ten, Giong, Tuoi…) → đổi sang tên dùng trong các màn giáo án
function toHorse(dto) {
  return {
    horseId: dto.horseID ?? dto.horseId,
    name: dto.ten,
    breed: dto.giong,
    age: dto.tuoi,
    photoUrl: dto.photoUrl ?? null,
  };
}

export async function getHorses() {
  const list = await apiRequest("/api/horses");
  return list.map(toHorse).sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

// ---- Thể trạng & lịch tuần của ngựa ----

export function getFitnessAssessment(horseId) {
  return apiRequest(`${TRAINER}/horses/${horseId}/fitness-assessment`);
}

// startDate mặc định Thứ Hai tới (hoặc hôm nay nếu là Thứ Hai), weeks 1–26 (mặc định 8)
export function getPlanSuggestion(horseId, { startDate, weeks } = {}) {
  return apiRequest(`${TRAINER}/horses/${horseId}/plan-suggestion`, { query: { startDate, weeks } });
}

// weekStart: ngày bất kỳ trong tuần (BE tự đưa về Thứ Hai)
export function getHorseWeeklySchedule(horseId, weekStart) {
  return apiRequest(`${TRAINER}/horses/${horseId}/weekly-schedule`, { query: { weekStart } });
}

// ---- Giáo án ----

export function getTrainingOptions() {
  return apiRequest(`${PLANS}/options`);
}

export function getTrainingPlans({ horseId, status } = {}) {
  return apiRequest(PLANS, { query: { horseId, status } });
}

export function getTrainingPlan(planId) {
  return apiRequest(`${PLANS}/${planId}`);
}

export function createTrainingPlan(body) {
  return apiRequest(PLANS, { method: "POST", body });
}

// phases = null → giữ nguyên giai đoạn (bắt buộc khi giáo án không còn Nháp)
export function updateTrainingPlan(planId, body) {
  return apiRequest(`${PLANS}/${planId}`, { method: "PUT", body });
}

export function deleteTrainingPlan(planId) {
  return apiRequest(`${PLANS}/${planId}`, { method: "DELETE" });
}

export function activateTrainingPlan(planId) {
  return apiRequest(`${PLANS}/${planId}/activate`, { method: "POST" });
}

export function completeTrainingPlan(planId) {
  return apiRequest(`${PLANS}/${planId}/complete`, { method: "POST" });
}

export function cancelTrainingPlan(planId) {
  return apiRequest(`${PLANS}/${planId}/cancel`, { method: "POST" });
}

// body: { weekStartDate, defaultStartTime, assignedToUserId, replaceExisting, previewOnly }
export function generateWeeklySchedule(planId, body) {
  return apiRequest(`${PLANS}/${planId}/weekly-schedule`, { method: "POST", body });
}

// body: { trainingDate, startTime, trainingType, distanceKm, durationMinutes, surface, sessionTitle, notes, assignedToUserId }
export function addPlanSession(planId, body) {
  return apiRequest(`${PLANS}/${planId}/sessions`, { method: "POST", body });
}

// ---- Buổi tập ----

// from mặc định hôm nay, to mặc định from + 6 (tối đa 62 ngày mỗi lần)
export function searchTrainingSessions({ from, to, horseId, planId, assignedToUserId, status } = {}) {
  return apiRequest(SESSIONS, { query: { from, to, horseId, planId, assignedToUserId, status } });
}

export function getAssignableStaff() {
  return apiRequest(`${SESSIONS}/assignable-staff`);
}

export function getTrainingSession(sessionId) {
  return apiRequest(`${SESSIONS}/${sessionId}`);
}

// PUT ghi đè toàn bộ: phải gửi lại assignedToUserId, sessionTitle, notes nếu muốn giữ
export function updateTrainingSession(sessionId, body) {
  return apiRequest(`${SESSIONS}/${sessionId}`, { method: "PUT", body });
}

// assignedToUserId = null → bỏ phân công
export function assignTrainingSession(sessionId, assignedToUserId) {
  return apiRequest(`${SESSIONS}/${sessionId}/assignment`, { method: "PUT", body: { assignedToUserId } });
}

export function startTrainingSession(sessionId) {
  return apiRequest(`${SESSIONS}/${sessionId}/start`, { method: "POST" });
}

export function completeTrainingSession(sessionId, body) {
  return apiRequest(`${SESSIONS}/${sessionId}/complete`, { method: "POST", body });
}

export function cancelTrainingSession(sessionId, reason) {
  return apiRequest(`${SESSIONS}/${sessionId}/cancel`, { method: "POST", body: { reason } });
}

export function deleteTrainingSession(sessionId) {
  return apiRequest(`${SESSIONS}/${sessionId}`, { method: "DELETE" });
}

// ---- Lịch được phân công (groom, head_trainer) — không gồm buổi đã hủy ----

export function getMyTrainingAssignments({ from, to } = {}) {
  return apiRequest("/api/training-assignments/me", { query: { from, to } });
}
