import { useCallback, useEffect, useState } from "react";
import useHorseRealtime from "../../hooks/useHorseRealtime";
import { getHealthStatuses, getHorseOwners, getHorses } from "../../services/horseService";
import { getHorseIdsWithRelatedData } from "../../services/horseUsageService";
import { getRaceRegistrations, getRaces } from "../../services/trainerService";
import { getActiveTrainingLocks, getMedicalRecords, getVaccinations } from "../../services/vetService";
import { getTrainingPlans, searchTrainingSessions } from "../../services/trainingApi";
import { fetchOwnerApprovals } from "../../services/authApi";
import { getStaffAccounts } from "../../services/managerStaffService";
import { getSupplies } from "../../services/supplyService";
import { getAllIncidentReports, getIncidentsForVet } from "../../services/careService";
import { listRaceRegistrations, getRaceOptions } from "../../services/raceRegistrationApi";
import { INCIDENT_STATUS } from "../../data/incidentOptions";
import { RR_STATUS } from "../../utils/raceRegistration";
import { addDays } from "../../utils/date";

// Mỗi mục thanh việc cần xử lý: { label, value, to, warn } — warn: số > 0 thì tô cam.

async function loadManager() {
  const [ownerApprovals, raceApprovals, incidents, staffList, supplies, ownerList, usedIds, raceList, regList] =
    await Promise.all([
      fetchOwnerApprovals().catch(() => []),
      listRaceRegistrations("club_manager").catch(() => []),
      getAllIncidentReports().catch(() => []),
      getStaffAccounts().catch(() => []),
      getSupplies().catch(() => []),
      getHorseOwners().catch(() => []),
      getHorseIdsWithRelatedData().catch(() => new Set()),
      getRaces().catch(() => []),
      getRaceRegistrations().catch(() => []),
    ]);

  const pendingAccounts = ownerApprovals.filter((a) => a.status === "pending").length;
  const pendingRaces = raceApprovals.filter((r) => r.status === RR_STATUS.PENDING_MANAGER).length;
  const newIncidents = incidents.filter((i) => i.TrangThai === INCIDENT_STATUS.NEW).length;
  const activeStaff = staffList.filter((s) => s.isActive !== false).length;
  const lowSupplies = supplies.filter((s) => Number(s.SoLuongTon ?? s.QuantityInStock ?? 0) <= 10).length;

  return {
    stats: [
      { label: "Tài khoản chờ duyệt", value: pendingAccounts, to: "/manager/approvals", warn: true },
      { label: "Giải đua chờ duyệt", value: pendingRaces, to: "/manager/race-registrations", warn: true },
      { label: "Sự cố mới", value: newIncidents, to: "/manager/incidents", warn: true },
      { label: "Vật tư sắp hết", value: lowSupplies, to: "/manager/supplies", warn: true },
      { label: "Nhân sự", value: activeStaff, to: "/manager/staff" },
    ],
    manager: {
      ownerById: Object.fromEntries(ownerList.map((o) => [o.UserID, o])),
      usedHorseIds: usedIds,
      races: raceList,
      registrations: regList,
    },
  };
}

async function loadTrainer(today, activeLocks) {
  const [plans, weekSessions, openRaces] = await Promise.all([
    getTrainingPlans().catch(() => []),
    searchTrainingSessions({ from: today, to: addDays(today, 6) }).catch(() => []),
    getRaceOptions().catch(() => []),
  ]);
  const activePlans = plans.filter((p) => p.status === "Active").length;
  const todaySessions = weekSessions.filter((s) => s.trainingDate === today && s.status !== "Cancelled").length;

  return {
    stats: [
      { label: "Giáo án đang áp dụng", value: activePlans, to: "/trainer/plans" },
      { label: "Buổi tập hôm nay", value: todaySessions, to: "/trainer/sessions", warn: true },
      { label: "Đang bị khóa tập", value: activeLocks.length, to: "/trainer/horses", warn: true },
      { label: "Giải đua đang mở", value: openRaces.length, to: "/trainer/race-registrations" },
    ],
  };
}

async function loadVet(today, activeLocks) {
  const [records, vaccinations, vetIncidents] = await Promise.all([
    getMedicalRecords().catch(() => []),
    getVaccinations().catch(() => []),
    getIncidentsForVet().catch(() => []),
  ]);
  const newVetIncidents = vetIncidents.filter((i) => i.TrangThai === INCIDENT_STATUS.NEW).length;
  const upcomingVaccines = vaccinations.filter(
    (v) => v.TrangThai !== "Đã tiêm" && v.NgayHen <= addDays(today, 14)
  ).length;

  return {
    stats: [
      { label: "Khóa tập", value: activeLocks.length, to: "/vet/locks", warn: true },
      { label: "Sự cố y tế mới", value: newVetIncidents, to: "/vet/incidents", warn: true },
      { label: "Mũi tiêm cần chú ý", value: upcomingVaccines, to: "/vet/vaccinations", warn: true },
      { label: "Hồ sơ khám", value: records.length, to: "/vet/exams" },
    ],
  };
}

// Tải dữ liệu trang Tổng quan theo vai trò (club_manager | head_trainer | veterinarian) và tự tải lại khi có realtime.
export default function useDashboardData(roleId, today) {
  const [loading, setLoading] = useState(true);
  const [horses, setHorses] = useState([]);
  const [healthMap, setHealthMap] = useState({});
  const [lockMap, setLockMap] = useState({});
  const [stats, setStats] = useState([]);
  const [manager, setManager] = useState({ ownerById: {}, usedHorseIds: new Set(), races: [], registrations: [] });

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const [horseList, healthList, activeLocks] = await Promise.all([
          getHorses().catch(() => []),
          getHealthStatuses().catch(() => []),
          getActiveTrainingLocks().catch(() => []),
        ]);
        setHorses(horseList);
        setHealthMap(Object.fromEntries(healthList.map((h) => [Number(h.HorseID), h])));
        setLockMap(Object.fromEntries(activeLocks.map((l) => [Number(l.HorseID), l])));

        if (roleId === "club_manager") {
          const result = await loadManager();
          setManager(result.manager);
          setStats(result.stats);
        } else if (roleId === "head_trainer") {
          setStats((await loadTrainer(today, activeLocks)).stats);
        } else if (roleId === "veterinarian") {
          setStats((await loadVet(today, activeLocks)).stats);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [roleId, today]
  );

  useEffect(() => {
    load();
  }, [load]);

  useHorseRealtime(() => {
    load({ silent: true });
  });

  return { loading, horses, healthMap, lockMap, stats, manager, reload: load };
}
