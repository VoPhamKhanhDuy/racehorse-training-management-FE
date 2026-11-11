// Compatibility adapters for profile/report screens. Training data always comes from BE.
import { apiRequest } from "./apiClient";
import { getAssignableStaff } from "./trainingApi";
import { getActiveTrainingLocks, getLatestExamDate, getVaccinations } from "./vetService";
export { getActiveTrainingLocks };
export { getHealthStatuses, getHorseById, getHorses } from "./horseService";
export {
  cancelRaceRegistration, dismissPrizeAlert, getPrizeAlerts, getRaceRegistrations,
  getRaces, registerHorseForRace, setRaceRegistrationPrize, updateRaceResult,
} from "./raceService";

const roleCode = (name) => ({ "Head Trainer": "head_trainer", "Horse Owner": "horse_owner", "Club Manager": "club_manager", "Groom": "groom", "Veterinarian": "veterinarian" })[name] ?? name;
const surfaceLabel = (surface) => ({ Dirt: "Đường đất", Turf: "Đường cỏ", Sand: "Đường cát", Synthetic: "Đường tổng hợp", Pool: "Hồ bơi" })[surface] ?? surface;

export async function getUsers() {
  return (await apiRequest("/training-overview/people")).map((u) => ({
    UserID: u.userID, HoTen: u.hoTen, Email: u.email, roleId: roleCode(u.roleName), isActive: u.isActive,
  }));
}
export async function getGrooms() {
  return (await getAssignableStaff()).filter((u) => u.roleId === "groom")
    .map((u) => ({ UserID: u.userId, HoTen: u.fullName, isActive: true }));
}
export async function getTrainingPlans(horseId) {
  return (await apiRequest("/training-overview/plans", { query: { horseId } })).map((p) => ({
    PlanID: p.planID, HorseID: p.horseID, CuLy: p.cuLy, KhoiLuong: p.khoiLuong,
    MatSan: surfaceLabel(p.matSan), GiaiDoan: p.giaiDoan, CreatedBy: p.createdBy,
    PlanName: p.planName, Status: p.planStatus, StartDate: p.startDate, EndDate: p.endDate,
  }));
}
export async function getTrainingPlanById(planId) {
  return (await getTrainingPlans()).find((p) => p.PlanID === Number(planId)) ?? null;
}
export async function getSchedules(date) {
  return (await apiRequest("/training-overview/schedules", { query: { date } })).map((s) => ({
    ScheduleID: s.scheduleID, HorseID: s.horseID, GroomID: s.groomID,
    Ngay: s.ngay, Gio: s.gio, PlanID: s.planId, Title: s.sessionTitle, Status: s.status,
  }));
}
export async function getTrainingSessions(horseId) {
  return (await apiRequest("/training-overview/results", { query: { horseId } })).map((s) => ({
    SessionID: s.sessionID, HorseID: s.horseID, Ngay: s.ngay,
    NhipTim: s.nhipTim, VanToc: s.vanToc, ChiSoTap: s.chiSoTap, NhanXet: s.nhanXet ?? "",
  }));
}
export async function getVaccinationSchedules(horseId) {
  return (await getVaccinations(horseId)).sort((a, b) => b.NgayHen.localeCompare(a.NgayHen));
}
export const getLatestCheckupDate = (horseId) => getLatestExamDate(horseId);
