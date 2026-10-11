import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import HorseProfileRow from "./HorseProfileRow";
import { getActiveTrainingLocks, getHealthStatuses, getHorses, getTrainingSessions, getUsers } from "../../services/trainerService";

// Pill lọc: 3 trạng thái HEALTHSTATUS + ngựa đang khóa tập (TRAININGLOCK chưa gỡ)
const LOCKED_FILTER = "locked";
const FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "Tốt", label: "Tốt" },
  { value: "Cần theo dõi", label: "Cần theo dõi" },
  { value: "Đang điều trị", label: "Đang điều trị" },
  { value: LOCKED_FILTER, label: "Đang khóa tập" },
];

// Hồ sơ ngựa của HLV trưởng — CHỈ XEM: danh sách dạng "sổ lý lịch" (mỗi ngựa 1 dòng có ảnh), bấm 1 dòng để mở hồ sơ
export default function HorseProfiles() {
  const [horses, setHorses] = useState([]);
  const [healthByHorse, setHealthByHorse] = useState({});
  const [lockedHorseIds, setLockedHorseIds] = useState(new Set());
  const [ownerNames, setOwnerNames] = useState({});
  const [latestIndexByHorse, setLatestIndexByHorse] = useState({}); // HorseID → chỉ số tập buổi mới nhất
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("");

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getHealthStatuses(), getActiveTrainingLocks(), getUsers(), getTrainingSessions()]).then(
      ([horseList, healthList, lockList, userList, sessionList]) => {
        if (ignore) return;
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setHealthByHorse(Object.fromEntries(healthList.map((h) => [h.HorseID, h.TrangThai])));
        setLockedHorseIds(new Set(lockList.map((l) => l.HorseID)));
        setOwnerNames(Object.fromEntries(userList.map((u) => [u.UserID, u.HoTen])));
        // sessionList đã sắp mới → cũ: buổi đầu tiên gặp của mỗi ngựa là buổi mới nhất
        const latest = {};
        for (const s of sessionList) latest[s.HorseID] ??= s.ChiSoTap;
        setLatestIndexByHorse(latest);
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  // Tìm theo tên + lọc pill, kết hợp AND
  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleHorses = horses.filter(
    (h) =>
      h.Ten.toLowerCase().includes(normalizedKeyword) &&
      (!filter || (filter === LOCKED_FILTER ? lockedHorseIds.has(h.HorseID) : healthByHorse[h.HorseID] === filter))
  );

  return (
    <div className="max-w-[1180px]">
      <h1 className="mb-5 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Hồ sơ ngựa</h1>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <label htmlFor="horseProfileKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" />
              <input
                id="horseProfileKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo tình trạng">
              {FILTERS.map((f) => {
                const active = filter === f.value;
                return (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-brass bg-brass/15 font-medium text-brass-deep"
                        : "border-stone/25 bg-white text-ink hover:border-stone/40"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {visibleHorses.length === 0 ? (
            <p className="border-t border-stone/20 py-10 text-center text-sm text-stone">Không tìm thấy ngựa nào khớp.</p>
          ) : (
            <ul className="border-t border-stone/20">
              {visibleHorses.map((horse) => (
                <HorseProfileRow
                  key={horse.HorseID}
                  horse={horse}
                  healthStatus={healthByHorse[horse.HorseID]}
                  ownerName={ownerNames[horse.OwnerID]}
                  locked={lockedHorseIds.has(horse.HorseID)}
                  latestIndex={latestIndexByHorse[horse.HorseID]}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
