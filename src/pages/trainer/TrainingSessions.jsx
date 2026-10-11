import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Search, SearchX } from "lucide-react";
import HorseIcon from "../../components/HorseIcon";
import LoadingState from "../../components/LoadingState";
import Sparkline from "../../components/Sparkline";
import SessionDetail from "./SessionDetail";
import { getActiveTrainingLocks, getHorses, getTrainingSessions } from "../../services/trainerService";
import { formatDayMonth } from "../../utils/date";

const LOCK_LABEL = "rounded-sm border border-stone/30 px-1 py-px text-[10px] font-medium text-stone whitespace-nowrap";

function HorseAvatar({ horse, size = "h-8 w-8" }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone/10 text-stone`}>
      {horse.photo ? (
        <img src={horse.photo} alt="" className="h-full w-full object-cover object-[center_25%]" />
      ) : (
        <HorseIcon className="h-4 w-4" />
      )}
    </span>
  );
}

// Kết quả buổi tập (TRAININGSESSION) dạng danh sách ngựa + chi tiết.
// Ngựa đang chọn nằm trên URL (?horse=ID) để quay lại từ form vẫn đúng ngựa.
// Desktop: danh sách dọc bên trái (cuộn riêng); điện thoại: thanh chip ngang cuộn được phía trên.
export default function TrainingSessions() {
  const { state } = useLocation(); // thông báo do form gửi sang
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [horses, setHorses] = useState([]);
  const [lockedHorseIds, setLockedHorseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState(state?.message ?? "");

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getTrainingSessions(), getHorses(), getActiveTrainingLocks()]).then(([sessionList, horseList, lockList]) => {
      if (ignore) return;
      setSessions(sessionList);
      setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
      setLockedHorseIds(new Set(lockList.map((l) => l.HorseID)));
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const sessionsByHorse = sessions.reduce((acc, s) => ({ ...acc, [s.HorseID]: [...(acc[s.HorseID] ?? []), s] }), {});
  const latestDate = (horseId) => (sessionsByHorse[horseId] ?? []).reduce((max, s) => (s.Ngay > max ? s.Ngay : max), "");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleHorses = horses.filter((h) => h.Ten.toLowerCase().includes(normalizedKeyword));

  // Ngựa chọn trên URL; chưa chọn thì ngựa đầu tiên (theo tên) có buổi tập
  const paramHorse = horses.find((h) => String(h.HorseID) === searchParams.get("horse"));
  const selectedHorse = paramHorse ?? horses.find((h) => sessionsByHorse[h.HorseID]?.length) ?? horses[0];
  const selectHorse = (horseId) => setSearchParams({ horse: horseId });

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Kết quả buổi tập</h1>

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
        <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
          <div className="min-w-0 space-y-3 lg:sticky lg:top-24">
            <div className="relative">
              <label htmlFor="sessionKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" />
              <input
                id="sessionKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>

            {visibleHorses.length === 0 ? (
              <p className="rounded-lg border border-stone/15 bg-white px-4 py-8 text-center text-sm text-stone">
                <SearchX className="mx-auto mb-2 h-8 w-8 text-stone/40" />
                Không tìm thấy ngựa phù hợp
              </p>
            ) : (
              <>
                {/* Điện thoại / máy tính bảng: thanh chip ngang cuộn được */}
                <div className="-mx-4 overflow-x-auto px-4 lg:hidden">
                  <div className="flex w-max gap-2 pb-1">
                    {visibleHorses.map((horse) => {
                      const selected = horse.HorseID === selectedHorse?.HorseID;
                      const locked = lockedHorseIds.has(horse.HorseID);
                      return (
                        <button
                          key={horse.HorseID}
                          type="button"
                          onClick={() => selectHorse(horse.HorseID)}
                          aria-pressed={selected}
                          className={`flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-sm transition-colors ${
                            selected
                              ? "border-brass bg-brass/15 font-medium text-brass-deep"
                              : `border-stone/25 bg-white hover:border-stone/40 ${locked ? "text-stone/60" : "text-ink"}`
                          }`}
                        >
                          <HorseAvatar horse={horse} size="h-6 w-6" />
                          {horse.Ten}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop: danh sách dọc, cuộn riêng khi dài */}
                <ul className="hidden max-h-[calc(100vh-11rem)] overflow-y-auto rounded-lg border border-stone/15 bg-white lg:block">
                  {visibleHorses.map((horse) => {
                    const selected = horse.HorseID === selectedHorse?.HorseID;
                    const locked = lockedHorseIds.has(horse.HorseID);
                    const count = sessionsByHorse[horse.HorseID]?.length ?? 0;
                    const latest = latestDate(horse.HorseID);
                    // Chỉ số tập các buổi gần đây (cũ → mới) cho sparkline + số gần nhất
                    const recentIndexes = [...(sessionsByHorse[horse.HorseID] ?? [])]
                      .sort((a, b) => a.Ngay.localeCompare(b.Ngay))
                      .slice(-8)
                      .map((sess) => sess.ChiSoTap);
                    return (
                      <li key={horse.HorseID} className="border-b border-stone/15 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => selectHorse(horse.HorseID)}
                          aria-current={selected ? "true" : undefined}
                          className={`relative flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selected
                              ? "bg-brass/10 before:absolute before:inset-y-1.5 before:left-0 before:w-[2px] before:bg-brass"
                              : "hover:bg-black/[0.03]"
                          }`}
                        >
                          <span className={locked ? "opacity-60" : ""}>
                            <HorseAvatar horse={horse} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className={`truncate font-serif text-base leading-snug font-semibold ${locked ? "text-stone" : "text-ink"}`}>
                                {horse.Ten}
                              </span>
                              {locked && <span className={LOCK_LABEL}>Đang khóa tập</span>}
                            </span>
                            <span className="block truncate text-xs text-stone">
                              {count ? `${count} buổi · gần nhất ${formatDayMonth(latest)}` : "Chưa có buổi tập"}
                            </span>
                          </span>
                          {/* Bên phải: chỉ số tập gần nhất + sparkline (ngựa đang khóa tập: không có sparkline) */}
                          {recentIndexes.length > 0 && (
                            <span className="flex shrink-0 flex-col items-end">
                              <span className={`font-serif text-[20px] leading-none font-semibold tabular-nums ${locked ? "text-stone/60" : "text-bark"}`}>
                                {recentIndexes[recentIndexes.length - 1]}
                              </span>
                              {!locked && (
                                <span className="mt-1">
                                  <Sparkline values={recentIndexes} />
                                </span>
                              )}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          <div className="min-w-0 rounded-lg border border-stone/15 bg-white px-4 py-5 sm:px-6">
            {selectedHorse ? (
              <SessionDetail
                key={selectedHorse.HorseID}
                horse={selectedHorse}
                sessions={sessionsByHorse[selectedHorse.HorseID] ?? []}
                isLocked={lockedHorseIds.has(selectedHorse.HorseID)}
              />
            ) : (
              <p className="py-10 text-center text-sm text-stone">Chưa có ngựa nào.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
