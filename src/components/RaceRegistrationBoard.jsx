import { useCallback, useEffect, useState } from "react";
import LoadingState from "./LoadingState";
import RaceRegistrationDialog from "./RaceRegistrationDialog";
import RaceRegistrationTable from "./RaceRegistrationTable";
import Toast from "./Toast";
import useAuth from "../hooks/useAuth";
import { getHealthStatuses, getHorseOwners, getHorses } from "../services/horseService";
import { getOwnerHorses } from "../services/ownerService";
import { listRaceRegistrations, markRaceRegistrationSeen, subscribeRaceRegistrations } from "../services/raceRegistrationApi";
import { getActiveTrainingLocks } from "../services/vetService";
import { ACTION_STATUS_BY_ROLE } from "../utils/raceRegistration";

const lastActivityAt = (record) => record.history.at(-1)?.at ?? record.createdAt;

// Trang danh sách "Đăng ký thi đấu" dùng chung cho Trainer / Chủ ngựa / Quản lý (MOCK — services/raceRegistrationApi.js):
// tiêu đề + (nút hành động riêng của vai trò) + bảng + khung chi tiết + thông báo. Tự tải lại khi đăng ký đổi (cùng trình duyệt).
// Chủ ngựa / Quản lý: hai tab "Chờ duyệt (n)" (mặc định) và "Đã xử lý" (mới xử lý trước). Trainer: một danh sách "Đăng ký của tôi".
export default function RaceRegistrationBoard({ title, description, headerAction = null, extraTab = null }) {
  const { user } = useAuth();
  const role = user.roleId;
  const isTrainer = role === "head_trainer";
  const [records, setRecords] = useState([]);
  const [context, setContext] = useState({ lockedHorseIds: new Set(), healthByHorse: {}, ownerNameByHorse: {} });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("pending");
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      // Chủ ngựa chỉ thấy đăng ký của ngựa mình
      const horseIds = role === "horse_owner" ? (await getOwnerHorses()).map((h) => h.HorseID) : [];
      setRecords(await listRaceRegistrations(role, { horseIds }));
      setLoadError("");
    } catch (err) {
      setLoadError(err.message || "Không tải được danh sách đăng ký.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
    return subscribeRaceRegistrations(load);
  }, [load]);

  // Tình trạng ngựa (khóa tập, sức khỏe) và tên chủ ngựa cho các cột của người duyệt — role nào chưa gọi được API nào thì bỏ qua phần đó
  useEffect(() => {
    let ignore = false;
    Promise.allSettled([
      getActiveTrainingLocks(),
      getHealthStatuses(),
      role === "club_manager" ? Promise.all([getHorses(), getHorseOwners()]) : Promise.resolve(null),
    ]).then(([locks, health, owners]) => {
      if (ignore) return;
      const ownerNameByHorse = {};
      if (owners.status === "fulfilled" && owners.value) {
        const [horses, ownerList] = owners.value;
        horses.forEach((h) => {
          const owner = ownerList.find((o) => String(o.UserID) === String(h.OwnerID));
          if (owner) ownerNameByHorse[h.HorseID] = owner.HoTen;
        });
      }
      setContext({
        lockedHorseIds: new Set(locks.status === "fulfilled" ? locks.value.map((l) => Number(l.HorseID)) : []),
        healthByHorse: health.status === "fulfilled" ? Object.fromEntries(health.value.map((h) => [Number(h.HorseID), h.TrangThai])) : {},
        ownerNameByHorse,
      });
    });
    return () => {
      ignore = true;
    };
  }, [role]);

  // Trainer mở đăng ký đã có kết quả → đã xem (tắt huy hiệu "Mới" ở menu)
  useEffect(() => {
    if (isTrainer && openId != null) markRaceRegistrationSeen(openId);
  }, [isTrainer, openId]);

  const closeToast = useCallback(() => setToast(null), []);
  const openRecord = records.find((r) => r.id === openId) ?? null;

  // Phân tab cho người duyệt
  const pendingStatus = ACTION_STATUS_BY_ROLE[role];
  const reachedManager = (r) => r.history.some((h) => h.step === "Owner" && h.action === "Đồng ý");
  const pending = records.filter((r) => r.status === pendingStatus);
  const processed = records
    .filter((r) => r.status !== pendingStatus && (role === "club_manager" ? reachedManager(r) : true))
    .sort((a, b) => lastActivityAt(b).localeCompare(lastActivityAt(a)));
  const visible = isTrainer ? records : tab === "pending" ? pending : processed;
  const tabs = [
    { code: "pending", label: `Chờ duyệt (${pending.length})` },
    { code: "done", label: "Đã xử lý" },
  ];
  const emptyText = isTrainer
    ? "Chưa có đăng ký thi đấu nào. Bấm \"Tạo đăng ký\" để bắt đầu."
    : tab === "pending"
      ? "Không có đăng ký nào đang chờ bạn duyệt."
      : "Chưa có đăng ký nào đã xử lý.";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#2b2118] sm:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-1 text-sm text-[#6b6055]">{description}</p>}
        </div>
        {headerAction}
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : (
        <>
          <div role="tablist" aria-label="Đăng ký thi đấu" className="mb-4 flex gap-6 border-b border-[#E3E3E3]">
            {(isTrainer ? [{ code: "pending", label: "Đăng ký của tôi" }, ...(extraTab ? [{ code: extraTab.code, label: extraTab.label }] : [])] : tabs).map((item) => (
              <button
                key={item.code}
                type="button"
                role="tab"
                aria-selected={tab === item.code}
                onClick={() => setTab(item.code)}
                className={`-mb-px border-b-2 pb-2.5 text-sm text-[#1f1f1f] transition-colors cursor-pointer ${
                  tab === item.code ? "border-[#c2570c] font-semibold" : "border-transparent font-medium hover:border-[#E3E3E3]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {extraTab && tab === extraTab.code ? (
            extraTab.content
          ) : (
          <RaceRegistrationTable
            key={tab}
            records={visible}
            role={role}
            tab={tab}
            context={context}
            onSelect={(record) => setOpenId(record.id)}
            emptyText={emptyText}
          />
          )}
        </>
      )}

      {openRecord && (
        <RaceRegistrationDialog
          key={`${openRecord.id}-${openRecord.status}`}
          record={openRecord}
          role={role}
          userName={user.fullName}
          onClose={() => setOpenId(null)}
          onChanged={(text) => {
            setOpenId(null);
            setToast({ text });
          }}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
