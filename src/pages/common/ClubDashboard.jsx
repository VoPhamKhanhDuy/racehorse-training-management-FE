import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockOpen, Stethoscope } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import HorseDetailModal from "../manager/HorseDetailModal";
import LockReleaseDialog from "../vet/LockReleaseDialog";
import DashboardHorseTable from "./DashboardHorseTable";
import DashboardStatCards from "./DashboardStatCards";
import useDashboardData from "./useDashboardData";
import { BUCKET_META, FILTER_TABS, HEALTH_BUCKETS, enrichHorses, isTreating, matchesTab } from "./dashboardHealth";
import { deleteHorseIfUnused } from "../../services/horseUsageService";
import { releaseTrainingLock } from "../../services/vetService";
import { saveLockReleaseNote } from "../../services/lockReleaseNoteMock";
import { addAuditLog } from "../../services/auditService";
import { getHorseAchievements } from "../../utils/horseAchievements";
import { formatDate, todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const actionBtn =
  "inline-flex h-7 cursor-pointer items-center gap-1 rounded border px-2.5 text-xs font-semibold transition-colors";

// Trang Tổng quan dùng chung cho quản lý CLB, bác sĩ thú y và HLV trưởng; khác nhau ở thanh việc cần xử lý,
// hành động khi bấm dòng và cột Thao tác (chỉ bác sĩ).
export default function ClubDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleId = user?.roleId;
  const currentUserId = toUserID(user?.id);
  const today = todayISO();

  const { loading, horses, healthMap, lockMap, stats, manager, reload } = useDashboardData(roleId, today);
  const [filterKey, setFilterKey] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [toast, setToast] = useState(null);

  const [selectedManagerHorse, setSelectedManagerHorse] = useState(null); // quản lý: modal hồ sơ ngựa
  const [horseToDelete, setHorseToDelete] = useState(null);
  const [deletingHorse, setDeletingHorse] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState(null); // bác sĩ: { lock, horse }

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
    await reload({ silent: true });
  };

  // Quản lý xóa ngựa từ modal chi tiết (nếu ngựa chưa có dữ liệu liên quan)
  const handleConfirmDeleteHorse = async () => {
    if (!horseToDelete) return;
    setDeletingHorse(true);
    try {
      await deleteHorseIfUnused(horseToDelete.HorseID);
      addAuditLog({ UserID: currentUserId, HanhDong: `Xóa hồ sơ ngựa ${horseToDelete.Ten} (#${horseToDelete.HorseID})` });
      setHorseToDelete(null);
      setToast({ text: `Đã xóa hồ sơ ngựa "${horseToDelete.Ten}".` });
      await reload({ silent: true });
    } catch (err) {
      setToast({ text: err.message || "Không xóa được hồ sơ ngựa." });
      setHorseToDelete(null);
    } finally {
      setDeletingHorse(false);
    }
  };

  if (loading) return <LoadingState />;

  const enriched = enrichHorses(horses, healthMap, lockMap);
  const countOf = (bucket) => enriched.filter((h) => h.bucket === bucket).length;
  const fitCount = countOf(HEALTH_BUCKETS.FIT);
  const watchCount = countOf(HEALTH_BUCKETS.WATCH);
  const treatingCount = countOf(HEALTH_BUCKETS.TREATING);
  const criticalCount = countOf(HEALTH_BUCKETS.CRITICAL);

  const breedsCount = new Set(enriched.map((h) => h.Giong).filter(Boolean)).size;
  const validAges = enriched.map((h) => h.age).filter((a) => a != null && a > 0);
  const avgAge = validAges.length
    ? (validAges.reduce((s, a) => s + a, 0) / validAges.length).toLocaleString("vi-VN", { maximumFractionDigits: 1 })
    : "—";

  const kw = keyword.trim().toLowerCase();
  const filteredHorses = enriched.filter(
    (h) =>
      matchesTab(h, filterKey) &&
      (!kw ||
        h.Ten.toLowerCase().includes(kw) ||
        (h.Giong ?? "").toLowerCase().includes(kw) ||
        h.statusText.toLowerCase().includes(kw))
  );

  const tabs = FILTER_TABS.map((tab) => ({ ...tab, count: enriched.filter((h) => matchesTab(h, tab.key)).length }));
  const segments = [
    { key: "fit", count: fitCount, color: BUCKET_META[HEALTH_BUCKETS.FIT].barColor },
    { key: "watch", count: watchCount, color: BUCKET_META[HEALTH_BUCKETS.WATCH].barColor },
    { key: "treating", count: treatingCount, color: BUCKET_META[HEALTH_BUCKETS.TREATING].barColor },
    { key: "critical", count: criticalCount, color: BUCKET_META[HEALTH_BUCKETS.CRITICAL].barColor },
  ];

  const isVet = roleId === "veterinarian";
  const isManager = roleId === "club_manager";

  // Bấm dòng: quản lý mở modal hồ sơ, bác sĩ mở bệnh án, HLV mở hồ sơ ngựa
  const openHorse = (horse) => {
    if (isManager) setSelectedManagerHorse(horse);
    else if (isVet) navigate(`/vet/exams?horse=${horse.HorseID}`);
    else navigate(`/trainer/horses/${horse.HorseID}`);
  };

  // Cột Thao tác (chỉ bác sĩ): "Khám", và "Gỡ khóa" khi ngựa đang bị khóa tập
  const renderVetActions = (horse) => (
    <div className="flex items-center justify-end gap-2">
      {horse.lock && (
        <button
          type="button"
          onClick={() => setUnlockTarget({ lock: horse.lock, horse })}
          className={`${actionBtn} border-transparent bg-[#c2570c] text-white hover:bg-[#a8480a]`}
        >
          <LockOpen className="h-3.5 w-3.5" /> Gỡ khóa
        </button>
      )}
      <Link
        to={`/vet/exams/new?horse=${horse.HorseID}`}
        className={`${actionBtn} border-[#d9cfba] bg-white text-[#2b2118] hover:border-[#b9ab90] hover:bg-[#faf7f2]`}
      >
        <Stethoscope className="h-3.5 w-3.5 text-[#c2570c]" /> Khám
      </Link>
    </div>
  );

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#2b2118] sm:text-[28px]">Tổng quan</h1>
        <span className="rounded border border-[#d9cfba] bg-white px-3 py-1.5 text-xs font-medium text-[#6b6055]">
          Cập nhật: {formatDate(today)}
        </span>
      </div>

      <DashboardStatCards
        counts={{
          total: enriched.length,
          fit: fitCount,
          watch: watchCount,
          treating: treatingCount + criticalCount,
          locked: Object.keys(lockMap).length,
        }}
        breedsCount={breedsCount}
        avgAge={avgAge}
        segments={segments}
        onFilter={setFilterKey}
        stats={stats}
      />

      <DashboardHorseTable
        tabs={tabs}
        filterKey={filterKey}
        onFilter={setFilterKey}
        keyword={keyword}
        onKeyword={setKeyword}
        horses={filteredHorses}
        isTreating={isTreating}
        onOpen={openHorse}
        renderActions={isVet ? renderVetActions : undefined}
        showLockReason={isVet}
      />

      {isManager && (
        <>
          <HorseDetailModal
            horse={selectedManagerHorse}
            owner={selectedManagerHorse ? manager.ownerById[selectedManagerHorse.OwnerID] : null}
            healthRecord={selectedManagerHorse ? healthMap[selectedManagerHorse.HorseID] : null}
            achievements={
              selectedManagerHorse
                ? getHorseAchievements(selectedManagerHorse.HorseID, manager.races, manager.registrations)
                : null
            }
            canDelete={selectedManagerHorse ? !manager.usedHorseIds.has(selectedManagerHorse.HorseID) : false}
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

      {isVet && unlockTarget && (
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
