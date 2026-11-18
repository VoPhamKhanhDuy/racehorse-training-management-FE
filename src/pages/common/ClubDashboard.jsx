import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Lock,
  LockOpen,
  Package,
  Plus,
  Search,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import useHorseRealtime from "../../hooks/useHorseRealtime";
import HorseDetailModal from "../manager/HorseDetailModal";
import LockReleaseDialog from "../vet/LockReleaseDialog";
import { getHealthStatuses, getHorseOwners, getHorses } from "../../services/horseService";
import { deleteHorseIfUnused, getHorseIdsWithRelatedData } from "../../services/horseUsageService";
import { getRaceRegistrations, getRaces } from "../../services/trainerService";
import { getHorseAchievements } from "../../utils/horseAchievements";
import {
  getActiveTrainingLocks,
  getMedicalRecords,
  getVaccinations,
  releaseTrainingLock,
} from "../../services/vetService";
import { saveLockReleaseNote } from "../../services/lockReleaseNoteMock";
import { getTrainingPlans, searchTrainingSessions } from "../../services/trainingApi";
import { fetchOwnerApprovals } from "../../services/authApi";
import { getStaffAccounts } from "../../services/managerStaffService";
import { getSupplies } from "../../services/supplyService";
import { getAllIncidentReports, getIncidentsForVet } from "../../services/careService";
import { listRaceRegistrations, getRaceOptions } from "../../services/raceRegistrationApi";
import { addAuditLog } from "../../services/auditService";
import { INCIDENT_STATUS } from "../../data/incidentOptions";
import { RR_STATUS } from "../../utils/raceRegistration";
import { addDays, formatDate, getHorseAge, todayISO } from "../../utils/date";
import { genderLabel } from "../../utils/horseGender";
import { toUserID } from "../../utils/userId";

const HEALTH_BUCKETS = {
  FIT: "fit",
  WATCH: "watch",
  TREATING: "treating",
  CRITICAL: "critical",
};

function classifyHealth(status, isLocked) {
  const s = (status ?? "Đủ điều kiện").trim();
  if (s === "Chấn thương" || s === "Cách ly") return HEALTH_BUCKETS.CRITICAL;
  if (s === "Đang điều trị" || isLocked) return HEALTH_BUCKETS.TREATING;
  if (s === "Cần theo dõi") return HEALTH_BUCKETS.WATCH;
  return HEALTH_BUCKETS.FIT;
}

const BUCKET_META = {
  [HEALTH_BUCKETS.FIT]: {
    label: "Đủ điều kiện",
    badgeBg: "bg-[#eef4e8]",
    badgeText: "text-[#4d6b2a]",
    barColor: "bg-[#5f7d37]",
    dotColor: "bg-[#5f7d37]",
    priority: 3,
  },
  [HEALTH_BUCKETS.WATCH]: {
    label: "Cần theo dõi",
    badgeBg: "bg-[#fdf3e7]",
    badgeText: "text-[#c2570c]",
    barColor: "bg-[#d97724]",
    dotColor: "bg-[#d97724]",
    priority: 2,
  },
  [HEALTH_BUCKETS.TREATING]: {
    label: "Đang điều trị",
    badgeBg: "bg-[#fbeae8]",
    badgeText: "text-[#b3473f]",
    barColor: "bg-[#c25048]",
    dotColor: "bg-[#c25048]",
    priority: 1,
  },
  [HEALTH_BUCKETS.CRITICAL]: {
    label: "Chấn thương / Cách ly",
    badgeBg: "bg-[#f8d7da]",
    badgeText: "text-[#842029]",
    barColor: "bg-[#8f2d36]",
    dotColor: "bg-[#8f2d36]",
    priority: 0,
  },
};

const FILTER_TABS = [
  { key: "all", label: "Tất cả đàn ngựa" },
  { key: "treating_all", label: "Đang điều trị & Khóa tập" },
  { key: HEALTH_BUCKETS.WATCH, label: "Cần theo dõi" },
  { key: HEALTH_BUCKETS.FIT, label: "Đủ điều kiện" },
];

export default function ClubDashboard() {
  const { user } = useAuth();
  const roleId = user?.roleId;
  const currentUserId = toUserID(user?.id);
  const today = todayISO();

  const [loading, setLoading] = useState(true);
  const [horses, setHorses] = useState([]);
  const [healthMap, setHealthMap] = useState({});
  const [lockMap, setLockMap] = useState({});
  const [extraStats, setExtraStats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filterKey, setFilterKey] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [toast, setToast] = useState(null);

  // Dữ liệu bổ trợ cho từng role trên bảng
  // - Manager: mở modal hồ sơ ngựa ngay tại chỗ
  const [ownerById, setOwnerById] = useState({});
  const [usedHorseIds, setUsedHorseIds] = useState(new Set());
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedManagerHorse, setSelectedManagerHorse] = useState(null);
  const [horseToDelete, setHorseToDelete] = useState(null);
  const [deletingHorse, setDeletingHorse] = useState(false);

  // - Trainer: map horseId -> giáo án đang áp dụng / nháp mới nhất
  const [trainerPlanByHorse, setTrainerPlanByHorse] = useState({});

  // - Vet: mở modal gỡ khóa huấn luyện ngay trên Dashboard
  const [unlockTarget, setUnlockTarget] = useState(null); // { lock, horse }

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const [horseList, healthList, activeLocks] = await Promise.all([
          getHorses().catch(() => []),
          getHealthStatuses().catch(() => []),
          getActiveTrainingLocks().catch(() => []),
        ]);

        const hMap = Object.fromEntries(healthList.map((h) => [Number(h.HorseID), h]));
        const lMap = Object.fromEntries(activeLocks.map((l) => [Number(l.HorseID), l]));

        setHorses(horseList);
        setHealthMap(hMap);
        setLockMap(lMap);

        // Tải thêm chỉ số vận hành theo từng vai trò
        if (roleId === "club_manager") {
          const [
            ownerApprovals,
            raceApprovals,
            incidents,
            staffList,
            supplies,
            ownerList,
            usedIds,
            raceList,
            regList,
          ] = await Promise.all([
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

          setOwnerById(Object.fromEntries(ownerList.map((o) => [o.UserID, o])));
          setUsedHorseIds(usedIds);
          setRaces(raceList);
          setRegistrations(regList);

          const pendingAccounts = ownerApprovals.filter((a) => a.status === "pending").length;
          const pendingRaces = raceApprovals.filter((r) => r.status === RR_STATUS.PENDING_MANAGER).length;
          const newIncidents = incidents.filter((i) => i.TrangThai === INCIDENT_STATUS.NEW).length;
          const activeStaff = staffList.filter((s) => s.isActive !== false).length;
          const lowSupplies = supplies.filter((s) => Number(s.SoLuongTon ?? s.QuantityInStock ?? 0) <= 10).length;

          setExtraStats([
            {
              label: "Tài khoản chờ duyệt",
              value: pendingAccounts,
              sub: `${ownerApprovals.length} tài khoản chủ ngựa`,
              to: "/manager/approvals",
              icon: UserCheck,
              highlight: pendingAccounts > 0,
            },
            {
              label: "Giải đua chờ duyệt",
              value: pendingRaces,
              sub: "Đề xuất từ HLV trưởng",
              to: "/manager/race-registrations",
              icon: Trophy,
              highlight: pendingRaces > 0,
            },
            {
              label: "Sự cố mới báo cáo",
              value: newIncidents,
              sub: `Tổng ${incidents.length} sự cố ghi nhận`,
              to: "/manager/incidents",
              icon: AlertTriangle,
              highlight: newIncidents > 0,
            },
            {
              label: "Nhân sự hoạt động",
              value: activeStaff,
              sub: lowSupplies > 0 ? `${lowSupplies} vật tư sắp hết` : "Vật tư ổn định",
              to: "/manager/staff",
              icon: Users,
              highlight: false,
            },
          ]);

          const managerAlerts = [];
          if (pendingAccounts > 0) {
            managerAlerts.push({
              title: `Có ${pendingAccounts} tài khoản Chủ ngựa mới đang chờ phê duyệt`,
              to: "/manager/approvals",
              actionLabel: "Duyệt tài khoản",
              tone: "warning",
            });
          }
          if (pendingRaces > 0) {
            managerAlerts.push({
              title: `Có ${pendingRaces} hồ sơ đăng ký thi đấu đang chờ Quản lý CLB duyệt`,
              to: "/manager/race-registrations",
              actionLabel: "Duyệt thi đấu",
              tone: "warning",
            });
          }
          if (newIncidents > 0) {
            managerAlerts.push({
              title: `Có ${newIncidents} báo cáo sự cố mới tại chuồng chưa có người nhận xử lý`,
              to: "/manager/incidents",
              actionLabel: "Xem sự cố",
              tone: "danger",
            });
          }
          if (lowSupplies > 0) {
            managerAlerts.push({
              title: `Có ${lowSupplies} mặt hàng vật tư trong kho còn tồn kho thấp (≤ 10)`,
              to: "/manager/supplies",
              actionLabel: "Kiểm tra kho",
              tone: "neutral",
            });
          }
          setAlerts(managerAlerts);
        } else if (roleId === "head_trainer") {
          const weekEnd = addDays(today, 6);
          const [plans, weekSessions, openRaces] = await Promise.all([
            getTrainingPlans().catch(() => []),
            searchTrainingSessions({ from: today, to: weekEnd }).catch(() => []),
            getRaceOptions().catch(() => []),
          ]);

          // Ưu tiên giáo án Active của ngựa, nếu chưa có thì lấy giáo án Draft mới nhất
          const planMap = {};
          for (const p of plans) {
            const hId = Number(p.horseId);
            if (!planMap[hId] || p.status === "Active") {
              planMap[hId] = p;
            }
          }
          setTrainerPlanByHorse(planMap);

          const activePlans = plans.filter((p) => p.status === "Active").length;
          const draftPlans = plans.filter((p) => p.status === "Draft").length;
          const todaySessions = weekSessions.filter((s) => s.trainingDate === today && s.status !== "Cancelled").length;
          const activeWeekSessions = weekSessions.filter((s) => s.status !== "Cancelled").length;

          setExtraStats([
            {
              label: "Giáo án đang áp dụng",
              value: activePlans,
              sub: `${draftPlans} giáo án nháp`,
              to: "/trainer/plans",
              icon: ClipboardList,
              highlight: false,
            },
            {
              label: "Buổi tập hôm nay",
              value: todaySessions,
              sub: `${activeWeekSessions} buổi trong 7 ngày tới`,
              to: "/trainer/sessions",
              icon: CalendarCheck,
              highlight: todaySessions > 0,
            },
            {
              label: "Đang bị khóa tập",
              value: activeLocks.length,
              sub: "Lệnh khóa từ Bác sĩ thú y",
              to: "/trainer/horses",
              icon: Lock,
              highlight: activeLocks.length > 0,
            },
            {
              label: "Giải đua đang mở",
              value: openRaces.length,
              sub: "Sẵn sàng đề xuất thi đấu",
              to: "/trainer/race-registrations",
              icon: Trophy,
              highlight: false,
            },
          ]);

          const trainerAlerts = [];
          if (activeLocks.length > 0) {
            trainerAlerts.push({
              title: `${activeLocks.length} chiến mã đang có lệnh Khóa huấn luyện từ Bác sĩ thú y`,
              to: "/trainer/horses",
              actionLabel: "Xem hồ sơ ngựa",
              tone: "danger",
            });
          }
          if (draftPlans > 0) {
            trainerAlerts.push({
              title: `Có ${draftPlans} giáo án đang ở trạng thái Nháp (cần gửi duyệt hoặc áp dụng)`,
              to: "/trainer/plans",
              actionLabel: "Mở giáo án",
              tone: "warning",
            });
          }
          if (todaySessions > 0) {
            trainerAlerts.push({
              title: `Hôm nay có ${todaySessions} buổi tập cần theo dõi tiến độ và đánh giá chuyên môn`,
              to: "/trainer/sessions",
              actionLabel: "Xem buổi tập",
              tone: "neutral",
            });
          }
          setAlerts(trainerAlerts);
        } else if (roleId === "veterinarian") {
          const [records, vaccinations, vetIncidents] = await Promise.all([
            getMedicalRecords().catch(() => []),
            getVaccinations().catch(() => []),
            getIncidentsForVet().catch(() => []),
          ]);

          const newVetIncidents = vetIncidents.filter((i) => i.TrangThai === INCIDENT_STATUS.NEW).length;
          const upcomingVaccines = vaccinations.filter(
            (v) => v.TrangThai !== "Đã tiêm" && v.NgayHen <= addDays(today, 14)
          ).length;

          setExtraStats([
            {
              label: "Lệnh khóa huấn luyện",
              value: activeLocks.length,
              sub: "Ngựa đang tạm ngưng tập",
              to: "/vet/locks",
              icon: ShieldAlert,
              highlight: activeLocks.length > 0,
            },
            {
              label: "Sự cố y tế mới",
              value: newVetIncidents,
              sub: "Báo cáo từ chuồng trại",
              to: "/vet/incidents",
              icon: AlertTriangle,
              highlight: newVetIncidents > 0,
            },
            {
              label: "Mũi tiêm cần chú ý",
              value: upcomingVaccines,
              sub: "Quá hạn hoặc trong 14 ngày tới",
              to: "/vet/vaccinations",
              icon: Syringe,
              highlight: upcomingVaccines > 0,
            },
            {
              label: "Hồ sơ khám bệnh",
              value: records.length,
              sub: "Lịch sử bệnh án toàn trại",
              to: "/vet/exams",
              icon: Stethoscope,
              highlight: false,
            },
          ]);

          const vetAlerts = [];
          if (newVetIncidents > 0) {
            vetAlerts.push({
              title: `Có ${newVetIncidents} sự cố sức khỏe mới tại chuồng cần Bác sĩ thú y tiếp nhận`,
              to: "/vet/incidents",
              actionLabel: "Xử lý sự cố",
              tone: "danger",
            });
          }
          if (upcomingVaccines > 0) {
            vetAlerts.push({
              title: `Có ${upcomingVaccines} lịch tiêm phòng quá hạn hoặc sắp đến hạn trong 14 ngày tới`,
              to: "/vet/vaccinations",
              actionLabel: "Lịch tiêm phòng",
              tone: "warning",
            });
          }
          if (activeLocks.length > 0) {
            vetAlerts.push({
              title: `${activeLocks.length} ngựa đang đặt lệnh Khóa huấn luyện (có thể gỡ khóa ngay bên dưới)`,
              to: "/vet/locks",
              actionLabel: "Quản lý lệnh khóa",
              tone: "neutral",
            });
          }
          setAlerts(vetAlerts);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [roleId, today]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useHorseRealtime(() => {
    loadDashboard({ silent: true });
  });

  // Bác sĩ gỡ lệnh khóa ngay trên Dashboard
  const handleConfirmUnlock = async ({ status, note }) => {
    if (!unlockTarget) return;
    const { lock, horse } = unlockTarget;
    await releaseTrainingLock(lock.LockID, status);
    saveLockReleaseNote(lock.LockID, {
      note: note.trim(),
      releasedByVetId: currentUserId,
      releasedByName: user?.fullName,
      healthAfter: status,
    });
    addAuditLog({
      UserID: currentUserId,
      HanhDong: `Gỡ lệnh khóa huấn luyện cho ngựa ${horse.Ten} (#${horse.HorseID}) — tình trạng mới: ${status}`,
    });
    setUnlockTarget(null);
    setToast({ text: `Đã gỡ lệnh khóa huấn luyện cho ${horse.Ten} (${status}).` });
    await loadDashboard({ silent: true });
  };

  // Quản lý xóa ngựa từ modal chi tiết (nếu ngựa chưa có dữ liệu liên quan)
  const handleConfirmDeleteHorse = async () => {
    if (!horseToDelete) return;
    setDeletingHorse(true);
    try {
      await deleteHorseIfUnused(horseToDelete.HorseID);
      addAuditLog({
        UserID: currentUserId,
        HanhDong: `Xóa hồ sơ ngựa ${horseToDelete.Ten} (#${horseToDelete.HorseID})`,
      });
      setHorseToDelete(null);
      setToast({ text: `Đã xóa hồ sơ ngựa "${horseToDelete.Ten}".` });
      await loadDashboard({ silent: true });
    } catch (err) {
      setToast({ text: err.message || "Không xóa được hồ sơ ngựa." });
      setHorseToDelete(null);
    } finally {
      setDeletingHorse(false);
    }
  };

  if (loading) return <LoadingState />;

  // Tổng hợp dữ liệu từng con ngựa
  const enrichedHorses = horses
    .map((horse) => {
      const health = healthMap[horse.HorseID];
      const lock = lockMap[horse.HorseID];
      const statusText = health?.TrangThai || "Đủ điều kiện";
      const bucket = classifyHealth(statusText, Boolean(lock));
      const meta = BUCKET_META[bucket];
      const age = getHorseAge(horse.NgaySinh) ?? horse.Tuoi ?? null;
      return {
        ...horse,
        statusText,
        updatedAt: health?.NgayCapNhat,
        lock,
        bucket,
        meta,
        age,
      };
    })
    .sort((a, b) => a.meta.priority - b.meta.priority || a.Ten.localeCompare(b.Ten, "vi"));

  const totalHorses = enrichedHorses.length;
  const fitCount = enrichedHorses.filter((h) => h.bucket === HEALTH_BUCKETS.FIT).length;
  const watchCount = enrichedHorses.filter((h) => h.bucket === HEALTH_BUCKETS.WATCH).length;
  const treatingCount = enrichedHorses.filter((h) => h.bucket === HEALTH_BUCKETS.TREATING).length;
  const criticalCount = enrichedHorses.filter((h) => h.bucket === HEALTH_BUCKETS.CRITICAL).length;
  const totalTreatingAndCritical = treatingCount + criticalCount;
  const lockedCount = Object.keys(lockMap).length;

  const breedsCount = new Set(enrichedHorses.map((h) => h.Giong).filter(Boolean)).size;
  const validAges = enrichedHorses.map((h) => h.age).filter((a) => a != null && a > 0);
  const avgAge = validAges.length
    ? (validAges.reduce((s, a) => s + a, 0) / validAges.length).toLocaleString("vi-VN", { maximumFractionDigits: 1 })
    : "—";

  const pct = (count) => (totalHorses > 0 ? Math.round((count / totalHorses) * 100) : 0);

  // Lọc danh sách ngựa bên dưới
  const kw = keyword.trim().toLowerCase();
  const filteredHorses = enrichedHorses.filter((h) => {
    if (filterKey === "treating_all") {
      if (h.bucket !== HEALTH_BUCKETS.TREATING && h.bucket !== HEALTH_BUCKETS.CRITICAL && !h.lock) return false;
    } else if (filterKey !== "all" && h.bucket !== filterKey) {
      return false;
    }
    if (!kw) return true;
    return (
      h.Ten.toLowerCase().includes(kw) ||
      (h.Giong ?? "").toLowerCase().includes(kw) ||
      h.statusText.toLowerCase().includes(kw)
    );
  });

  const selectedManagerAchievements = selectedManagerHorse
    ? getHorseAchievements(selectedManagerHorse.HorseID, races, registrations)
    : null;

  // Render cột Thao tác thông minh theo từng Role
  const renderActions = (horse) => {
    if (roleId === "veterinarian") {
      return (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {horse.lock ? (
            <button
              type="button"
              onClick={() => setUnlockTarget({ lock: horse.lock, horse })}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded bg-[#c2570c] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#a8480a]"
            >
              <LockOpen className="h-3.5 w-3.5" />
              Gỡ khóa tập
            </button>
          ) : (
            (horse.bucket === HEALTH_BUCKETS.TREATING || horse.bucket === HEALTH_BUCKETS.CRITICAL) && (
              <Link
                to={`/vet/locks/new?horse=${horse.HorseID}`}
                className="inline-flex h-8 items-center gap-1 rounded border border-[#b3473f]/40 bg-[#fbeae8] px-2.5 text-xs font-semibold text-[#b3473f] transition-colors hover:bg-[#f5d5d1]"
              >
                <Lock className="h-3 w-3" />
                Khóa tập
              </Link>
            )
          )}
          <Link
            to={`/vet/exams/new?horse=${horse.HorseID}`}
            className="inline-flex h-8 items-center gap-1 rounded border border-[#d9cfba] bg-white px-2.5 text-xs font-semibold text-[#2b2118] transition-colors hover:border-[#b9ab90] hover:bg-[#faf7f2]"
          >
            <Stethoscope className="h-3.5 w-3.5 text-[#c2570c]" />
            {horse.bucket === HEALTH_BUCKETS.TREATING || horse.bucket === HEALTH_BUCKETS.CRITICAL
              ? "Khám / Đổi trạng thái"
              : "Khám bệnh"}
          </Link>
          <Link
            to={`/vet/exams?horse=${horse.HorseID}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6b6055] hover:text-[#2b2118] hover:underline"
          >
            Bệnh án
          </Link>
        </div>
      );
    }

    if (roleId === "head_trainer") {
      const plan = trainerPlanByHorse[horse.HorseID];
      const canTrain = !horse.lock && horse.bucket !== HEALTH_BUCKETS.CRITICAL;
      return (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {plan ? (
            <Link
              to={`/trainer/plans/${plan.planId}`}
              className="inline-flex h-8 items-center gap-1 rounded border border-[#d9cfba] bg-[#faf7f2] px-2.5 text-xs font-semibold text-[#2b2118] transition-colors hover:border-[#b9ab90] hover:bg-white"
            >
              <ClipboardList className="h-3.5 w-3.5 text-[#c2570c]" />
              {plan.status === "Active" ? "Giáo án đang tập" : "Giáo án nháp"}
            </Link>
          ) : (
            canTrain && (
              <Link
                to={`/trainer/plans/new?horse=${horse.HorseID}`}
                className="inline-flex h-8 items-center gap-1 rounded border border-[#c2570c]/40 bg-[#fdf3e7] px-2.5 text-xs font-semibold text-[#c2570c] transition-colors hover:bg-[#fae6cf]"
              >
                <Plus className="h-3.5 w-3.5" />
                Lập giáo án
              </Link>
            )
          )}
          <Link
            to={`/trainer/horses/${horse.HorseID}`}
            className="inline-flex h-8 items-center gap-1 rounded border border-[#d9cfba] bg-white px-2.5 text-xs font-semibold text-[#c2570c] transition-colors hover:border-[#c2570c]"
          >
            Hồ sơ & Thể lực <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      );
    }

    // Mặc định: Quản lý CLB (club_manager) -> Mở trực tiếp Modal hồ sơ của đúng con ngựa đó
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setSelectedManagerHorse(horse)}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-[#d9cfba] bg-white px-3 text-xs font-semibold text-[#c2570c] transition-colors hover:border-[#c2570c] hover:bg-[#faf7f2]"
        >
          Xem hồ sơ {horse.Ten} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#2b2118] sm:text-[28px]">
            Bảng tổng quan đàn ngựa (Dashboard)
          </h1>
          <p className="mt-1 text-sm text-[#6b6055]">
            Số liệu thời gian thực về tổng đàn, số ngựa đang điều trị, tình trạng sức khỏe và thao tác nhanh theo vai trò.
          </p>
        </div>
        <span className="rounded border border-[#d9cfba] bg-white px-3 py-1.5 text-xs font-medium text-[#6b6055]">
          Cập nhật: {formatDate(today)}
        </span>
      </div>

      {/* Hàng 1: 4 KPI Cards về Đàn ngựa */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Tổng đàn */}
        <button
          type="button"
          onClick={() => setFilterKey("all")}
          className={`flex cursor-pointer flex-col justify-between rounded-lg border bg-white p-5 text-left transition-all hover:border-[#b9ab90] ${
            filterKey === "all" ? "border-[#c2570c] ring-1 ring-[#c2570c]/30" : "border-[#e2d9c8]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#6b6055]">Tổng số ngựa trong trại</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5efe6] text-[#2b2118]">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#2b2118]">{totalHorses}</span>
            <span className="text-sm text-[#6b6055]">chiến mã</span>
          </div>
          <p className="mt-2 text-xs text-[#6b6055]">
            {breedsCount} giống ngựa · Tuổi trung bình: <b className="font-semibold text-[#2b2118]">{avgAge} tuổi</b>
          </p>
        </button>

        {/* Card 2: Đang điều trị / Chấn thương / Khóa tập */}
        <button
          type="button"
          onClick={() => setFilterKey("treating_all")}
          className={`flex cursor-pointer flex-col justify-between rounded-lg border bg-white p-5 text-left transition-all hover:border-[#b3473f] ${
            filterKey === "treating_all" ? "border-[#b3473f] ring-1 ring-[#b3473f]/30" : "border-[#e2d9c8]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#6b6055]">Đang điều trị & Chấn thương</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fbeae8] text-[#b3473f]">
              <Stethoscope className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#b3473f]">{totalTreatingAndCritical}</span>
            <span className="text-sm text-[#6b6055]">/ {totalHorses} con ({pct(totalTreatingAndCritical)}%)</span>
          </div>
          <p className="mt-2 text-xs text-[#6b6055]">
            Đang điều trị: <b className="font-semibold text-[#b3473f]">{treatingCount}</b> · Chấn thương/Cách ly:{" "}
            <b className="font-semibold text-[#842029]">{criticalCount}</b> · Khóa tập:{" "}
            <b className="font-semibold text-[#2b2118]">{lockedCount}</b>
          </p>
        </button>

        {/* Card 3: Cần theo dõi */}
        <button
          type="button"
          onClick={() => setFilterKey(HEALTH_BUCKETS.WATCH)}
          className={`flex cursor-pointer flex-col justify-between rounded-lg border bg-white p-5 text-left transition-all hover:border-[#c2570c] ${
            filterKey === HEALTH_BUCKETS.WATCH ? "border-[#c2570c] ring-1 ring-[#c2570c]/30" : "border-[#e2d9c8]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#6b6055]">Cần theo dõi thêm</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fdf3e7] text-[#c2570c]">
              <HeartPulse className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#c2570c]">{watchCount}</span>
            <span className="text-sm text-[#6b6055]">/ {totalHorses} con ({pct(watchCount)}%)</span>
          </div>
          <p className="mt-2 text-xs text-[#6b6055]">
            Cần kiểm tra thể lực & theo dõi sát phản ứng sau tập
          </p>
        </button>

        {/* Card 4: Đủ điều kiện */}
        <button
          type="button"
          onClick={() => setFilterKey(HEALTH_BUCKETS.FIT)}
          className={`flex cursor-pointer flex-col justify-between rounded-lg border bg-white p-5 text-left transition-all hover:border-[#4d6b2a] ${
            filterKey === HEALTH_BUCKETS.FIT ? "border-[#4d6b2a] ring-1 ring-[#4d6b2a]/30" : "border-[#e2d9c8]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#6b6055]">Đủ điều kiện (Sẵn sàng)</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef4e8] text-[#4d6b2a]">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#4d6b2a]">{fitCount}</span>
            <span className="text-sm text-[#6b6055]">/ {totalHorses} con ({pct(fitCount)}%)</span>
          </div>
          <p className="mt-2 text-xs text-[#6b6055]">
            Sức khỏe tốt, sẵn sàng huấn luyện và đăng ký thi đấu
          </p>
        </button>
      </div>

      {/* Hàng 2: Thanh tỷ lệ phân bổ sức khỏe toàn trại */}
      <div className="rounded-lg border border-[#e2d9c8] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-[#2b2118]">
            Tỷ lệ phân bổ sức khỏe đàn ngựa
          </h2>
          <span className="text-xs text-[#6b6055]">
            Bấm vào từng thẻ trên hoặc nút lọc bên dưới để xem danh sách ngựa tương ứng
          </span>
        </div>

        <div className="mt-3 flex h-3.5 w-full overflow-hidden rounded-full bg-[#f0ebe1]">
          {fitCount > 0 && (
            <div
              style={{ width: `${(fitCount / totalHorses) * 100}%` }}
              className="bg-[#5f7d37] transition-all"
              title={`Đủ điều kiện: ${fitCount} con (${pct(fitCount)}%)`}
            />
          )}
          {watchCount > 0 && (
            <div
              style={{ width: `${(watchCount / totalHorses) * 100}%` }}
              className="bg-[#d97724] transition-all"
              title={`Cần theo dõi: ${watchCount} con (${pct(watchCount)}%)`}
            />
          )}
          {treatingCount > 0 && (
            <div
              style={{ width: `${(treatingCount / totalHorses) * 100}%` }}
              className="bg-[#c25048] transition-all"
              title={`Đang điều trị: ${treatingCount} con (${pct(treatingCount)}%)`}
            />
          )}
          {criticalCount > 0 && (
            <div
              style={{ width: `${(criticalCount / totalHorses) * 100}%` }}
              className="bg-[#8f2d36] transition-all"
              title={`Chấn thương / Cách ly: ${criticalCount} con (${pct(criticalCount)}%)`}
            />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-6 text-xs text-[#2b2118]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#5f7d37]" />
            Đủ điều kiện: <b>{fitCount}</b> ({pct(fitCount)}%)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d97724]" />
            Cần theo dõi: <b>{watchCount}</b> ({pct(watchCount)}%)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c25048]" />
            Đang điều trị: <b>{treatingCount}</b> ({pct(treatingCount)}%)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8f2d36]" />
            Chấn thương / Cách ly: <b>{criticalCount}</b> ({pct(criticalCount)}%)
          </span>
        </div>
      </div>

      {/* Hàng 3: Thống kê vận hành theo vai trò */}
      {extraStats.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {extraStats.map((item) => {
            const Icon = item.icon || Package;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`group flex flex-col justify-between rounded-lg border bg-[#faf7f2] p-4 transition-colors hover:border-[#b9ab90] hover:bg-white ${
                  item.highlight ? "border-[#d97724]/60" : "border-[#e2d9c8]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-[#6b6055] uppercase">
                    {item.label}
                  </span>
                  <Icon className={`h-4 w-4 ${item.highlight ? "text-[#c2570c]" : "text-[#6b6055]"}`} />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-serif text-2xl font-bold text-[#2b2118]">{item.value}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#c2570c] group-hover:underline">
                    Chi tiết <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#6b6055]">{item.sub}</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Cảnh báo / Nhắc việc nhanh */}
      {alerts.length > 0 && (
        <div className="rounded-lg border border-[#e2d9c8] bg-white p-5">
          <h2 className="font-serif text-lg font-semibold text-[#2b2118]">
            Việc cần chú ý & Xử lý nhanh
          </h2>
          <div className="mt-3 divide-y divide-[#eee7da]">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5 text-sm text-[#2b2118]">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      alert.tone === "danger"
                        ? "bg-[#b3473f]"
                        : alert.tone === "warning"
                          ? "bg-[#c2570c]"
                          : "bg-[#6b6055]"
                    }`}
                  />
                  <span>{alert.title}</span>
                </div>
                <Link
                  to={alert.to}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#c2570c] hover:underline"
                >
                  {alert.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hàng 4: Bảng theo dõi tình trạng từng con ngựa trong trại */}
      <div className="rounded-lg border border-[#e2d9c8] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2d9c8] p-5">
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_TABS.map((tab) => {
              const active = filterKey === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterKey(tab.key)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-[#2b2118] text-white"
                      : "bg-[#f4efe6] text-[#6b6055] hover:bg-[#e8dfd1] hover:text-[#2b2118]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8a7f6e]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm tên ngựa, giống, trạng thái..."
              className="h-9 w-full rounded border border-[#d9cfba] bg-white pr-3 pl-9 text-xs text-[#2b2118] placeholder:text-[#8a7f6e] focus:border-[#c2570c] focus:outline-none"
            />
          </div>
        </div>

        {filteredHorses.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#6b6055]">
            Không có chiến mã nào trong nhóm lọc này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2d9c8] bg-[#faf7f2] text-xs font-semibold text-[#6b6055]">
                  <th className="px-5 py-3">Chiến mã</th>
                  <th className="px-4 py-3">Giống & Giới tính</th>
                  <th className="px-4 py-3">Tuổi & Cân nặng</th>
                  <th className="px-4 py-3">Trạng thái sức khỏe</th>
                  <th className="px-4 py-3">Tình trạng huấn luyện</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7da]">
                {filteredHorses.map((horse) => (
                  <tr key={horse.HorseID} className="transition-colors hover:bg-[#faf7f2]/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {horse.photo ? (
                          <img
                            src={horse.photo}
                            alt={horse.Ten}
                            className="h-10 w-10 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#ede5d8] font-serif text-sm font-bold text-[#2b2118]">
                            {horse.Ten?.charAt(0) || "H"}
                          </span>
                        )}
                        <div>
                          <p className="font-serif text-base font-semibold text-[#2b2118]">{horse.Ten}</p>
                          {horse.DongDoi && <p className="text-xs text-[#6b6055]">Dòng dõi: {horse.DongDoi}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#2b2118]">
                      <p className="font-medium">{horse.Giong || "—"}</p>
                      <p className="text-xs text-[#6b6055]">{genderLabel(horse.GioiTinh) || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[#2b2118]">
                      <p>{horse.age != null ? `${horse.age} tuổi` : "—"}</p>
                      <p className="text-xs text-[#6b6055]">
                        {horse.CanNang ? `${horse.CanNang.toLocaleString("vi-VN")} kg` : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${horse.meta.badgeBg} ${horse.meta.badgeText}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${horse.meta.dotColor}`} />
                        {horse.statusText}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {horse.lock ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#b3473f]">
                            <Lock className="h-3.5 w-3.5" /> Đang khóa huấn luyện
                          </span>
                          {horse.lock.LyDo && (
                            <p className="mt-0.5 max-w-[220px] truncate text-xs text-[#6b6055]" title={horse.lock.LyDo}>
                              Lý do: {horse.lock.LyDo}
                            </p>
                          )}
                        </div>
                      ) : horse.bucket === HEALTH_BUCKETS.TREATING || horse.bucket === HEALTH_BUCKETS.CRITICAL ? (
                        <span className="text-xs font-medium text-[#b3473f]">Hạn chế tập nặng (đang điều trị)</span>
                      ) : (
                        <span className="text-xs font-medium text-[#4d6b2a]">Sẵn sàng tập luyện</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">{renderActions(horse)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chi tiết Hồ sơ ngựa (dành cho Quản lý CLB ngay tại Dashboard) */}
      {roleId === "club_manager" && (
        <>
          <HorseDetailModal
            horse={selectedManagerHorse}
            owner={selectedManagerHorse ? ownerById[selectedManagerHorse.OwnerID] : null}
            healthRecord={selectedManagerHorse ? healthMap[selectedManagerHorse.HorseID] : null}
            achievements={selectedManagerAchievements}
            canDelete={selectedManagerHorse ? !usedHorseIds.has(selectedManagerHorse.HorseID) : false}
            onClose={() => setSelectedManagerHorse(null)}
            onDelete={(horse) => {
              setSelectedManagerHorse(null);
              setHorseToDelete(horse);
            }}
          />
          <ConfirmDialog
            open={Boolean(horseToDelete)}
            title="Xóa hồ sơ ngựa"
            message={
              horseToDelete
                ? `Bạn có chắc muốn xóa hồ sơ ngựa "${horseToDelete.Ten}"? Thao tác này không thể hoàn tác.`
                : ""
            }
            confirmLabel={deletingHorse ? "Đang xóa..." : "Xóa"}
            danger
            onConfirm={handleConfirmDeleteHorse}
            onCancel={() => !deletingHorse && setHorseToDelete(null)}
          />
        </>
      )}

      {/* Modal Gỡ lệnh khóa huấn luyện ngay trên Dashboard (dành cho Bác sĩ thú y) */}
      {roleId === "veterinarian" && unlockTarget && (
        <LockReleaseDialog
          lock={unlockTarget.lock}
          horse={unlockTarget.horse}
          onConfirm={handleConfirmUnlock}
          onClose={() => setUnlockTarget(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
