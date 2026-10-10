import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Search, SearchX } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import HorsePlanDetail from "./HorsePlanDetail";
import HorsePlanList from "./HorsePlanList";
import useAuth from "../../hooks/useAuth";
import {
  getActiveTrainingLocks,
  getHealthStatuses,
  getHorses,
  getTrainingPlans,
  getTrainingSessions,
  getUsers,
} from "../../services/trainerService";
import { toUserID } from "../../utils/userId";

// Giáo án tập luyện dạng danh sách + chi tiết: trái là ngựa, phải là 4 mốc giai đoạn của ngựa đang chọn.
// Ngựa đang chọn nằm trên URL (?horse=ID) — dưới lg chỉ hiện 1 màn: chưa chọn → danh sách, đã chọn → chi tiết.
export default function TrainingPlans() {
  const { user } = useAuth();
  const currentUserId = toUserID(user.id);
  const { state } = useLocation(); // thông báo do form thêm/sửa/xóa gửi sang
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [horses, setHorses] = useState([]);
  const [locks, setLocks] = useState([]); // TRAININGLOCK chưa gỡ
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [message, setMessage] = useState(state?.message ?? "");

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([
      getTrainingPlans(),
      getHorses(),
      getActiveTrainingLocks(),
      getHealthStatuses(),
      getTrainingSessions(),
      getUsers(),
    ]).then(([planList, horseList, lockList, healthList, sessionList, userList]) => {
      if (ignore) return;
      setPlans(planList);
      setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
      setLocks(lockList);
      setHealthStatuses(healthList);
      setSessions(sessionList);
      setUsers(userList);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const userNameById = Object.fromEntries(users.map((u) => [u.UserID, u.HoTen]));
  const plansByHorse = plans.reduce((acc, p) => ({ ...acc, [p.HorseID]: [...(acc[p.HorseID] ?? []), p] }), {});
  // "Còn thiếu giáo án" = chưa có giáo án nào (0/4 giai đoạn)
  const hasNoPlan = (horse) => !plansByHorse[horse.HorseID]?.length;

  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleHorses = horses.filter(
    (h) => h.Ten.toLowerCase().includes(normalizedKeyword) && (!onlyMissing || hasNoPlan(h))
  );

  // Ngựa chọn trên URL — chỉ tính khi ngựa đó còn trong danh sách đang hiển thị.
  // Chưa chọn (hoặc bộ lọc làm ngựa đang chọn biến mất): chọn ngựa đầu tiên còn lại,
  // ưu tiên ngựa đã có giáo án khi công tắc đang tắt.
  const paramHorse = visibleHorses.find((h) => String(h.HorseID) === searchParams.get("horse"));
  const defaultHorse = (!onlyMissing && visibleHorses.find((h) => !hasNoPlan(h))) || visibleHorses[0];
  const selectedHorse = paramHorse ?? defaultHorse;
  const showDetailOnMobile = Boolean(paramHorse);
  const selectedLock = selectedHorse ? locks.find((l) => l.HorseID === selectedHorse.HorseID) ?? null : null;

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Giáo án tập luyện</h1>

      {message && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-sm border-l-2 border-green-700 bg-white/60 px-4 py-3 text-sm text-green-800">
          {message}
          <button type="button" onClick={() => setMessage("")} className="cursor-pointer font-semibold text-green-700 hover:underline">
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Cột trái: tìm kiếm + công tắc + danh sách ngựa */}
          <div className={`space-y-4 lg:sticky lg:top-24 ${showDetailOnMobile ? "hidden lg:block" : ""}`}>
            <div className="relative">
              <label htmlFor="planKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" />
              <input
                id="planKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>

            {/* Công tắc bật/tắt: track cam khi bật, xám khi tắt */}
            <button
              type="button"
              role="switch"
              aria-checked={onlyMissing}
              onClick={() => setOnlyMissing((prev) => !prev)}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
            >
              <span
                aria-hidden="true"
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${onlyMissing ? "bg-brass" : "bg-stone/25"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    onlyMissing ? "translate-x-4" : ""
                  }`}
                />
              </span>
              Chỉ hiện ngựa còn thiếu giáo án
            </button>

            <div className="overflow-hidden rounded-lg border border-stone/15 bg-white">
              <p className="border-b border-stone/15 px-4 py-2 text-xs font-medium text-stone">{visibleHorses.length} ngựa</p>
              {visibleHorses.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-stone">
                  <SearchX className="mx-auto mb-2 h-8 w-8 text-stone/40" />
                  {onlyMissing && !normalizedKeyword ? "Tất cả ngựa đều đã có giáo án" : "Không tìm thấy ngựa phù hợp"}
                </div>
              ) : (
                <HorsePlanList
                  horses={visibleHorses}
                  plansByHorse={plansByHorse}
                  selectedId={selectedHorse?.HorseID}
                  defaultSelection={!paramHorse}
                  onSelect={(horseId) => setSearchParams({ horse: horseId })}
                />
              )}
            </div>
          </div>

          {/* Cột phải: chi tiết ngựa đang chọn. Dưới lg chỉ hiện khi đã chọn ngựa, kèm nút quay lại danh sách */}
          <div className={showDetailOnMobile ? "" : "hidden lg:block"}>
            <Link to="/trainer/plans" className="mb-4 inline-block text-sm font-medium text-brass-deep hover:underline lg:hidden">
              ← Danh sách ngựa
            </Link>
            <div className="rounded-lg border border-stone/15 bg-white px-5 py-5 sm:px-6">
              {selectedHorse ? (
                <HorsePlanDetail
                  horse={selectedHorse}
                  plans={plansByHorse[selectedHorse.HorseID] ?? []}
                  healthStatus={healthStatuses.find((h) => h.HorseID === selectedHorse.HorseID)?.TrangThai}
                  lock={selectedLock}
                  lockedByName={selectedLock ? userNameById[selectedLock.LockedBy] : undefined}
                  sessions={sessions.filter((s) => s.HorseID === selectedHorse.HorseID)}
                  currentUserId={currentUserId}
                />
              ) : (
                <p className="py-10 text-center text-sm text-stone">Chọn một ngựa để xem giáo án.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
