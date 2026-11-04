import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, Search, SearchX, UserRound } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import AuditLogItem from "./AuditLogItem";
import { STAFF_ROLE_IDS } from "../../data/roles";
import { getUsers } from "../../services/accountService";
import { getAuditLogs } from "../../services/auditService";
import { daysFromToday, todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

// Khoảng thời gian: ngày bắt đầu (tính cả hôm nay)
const TIME_RANGES = [
  { key: "today", label: "Hôm nay", startDate: () => todayISO() },
  { key: "7d", label: "7 ngày qua", startDate: () => daysFromToday(-6) },
  { key: "30d", label: "30 ngày qua", startDate: () => daysFromToday(-29) },
];

// Người thực hiện thao tác: nhân sự nội bộ + Quản lý CLB
const ACTOR_ROLE_IDS = [...STAFF_ROLE_IDS, "club_manager"];

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [actorId, setActorId] = useState(""); // "" = mọi người
  const [timeRange, setTimeRange] = useState("30d");

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock auditService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getAuditLogs(), getUsers()]).then(([logList, userList]) => {
      if (ignore) return;
      setLogs(logList);
      setActors(
        userList
          .filter((u) => ACTOR_ROLE_IDS.includes(u.roleId))
          .map((u) => ({ UserID: toUserID(u.id), fullName: u.fullName }))
          .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))
      );
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Các bộ lọc kết hợp AND: từ khóa (người / hành động / đối tượng), người thực hiện, khoảng thời gian
  const normalizedKeyword = keyword.trim().toLowerCase();
  const startDate = TIME_RANGES.find((r) => r.key === timeRange).startDate();
  const visibleLogs = logs.filter(
    (log) =>
      (!normalizedKeyword ||
        [log.actorName, log.HanhDong, log.targetName].some((text) => text.toLowerCase().includes(normalizedKeyword))) &&
      (!actorId || log.UserID === Number(actorId)) &&
      log.ThoiGian.slice(0, 10) >= startDate
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Nhật ký thao tác</h1>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          <div className="w-full max-w-xl space-y-3">
            <div className="relative w-full">
              <label htmlFor="auditKeyword" className="sr-only">
                Tìm theo người thực hiện hoặc hành động
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" />
              <input
                id="auditKeyword"
                type="search"
                placeholder="Tìm theo người hoặc hành động..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-lg border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-1.5">
                <label htmlFor="auditActor" className="flex items-center gap-2 text-sm font-semibold text-stone">
                  <UserRound aria-hidden="true" className="h-4 w-4 text-stone" />
                  Người thực hiện
                </label>
                <div className="relative">
                  <select
                    id="auditActor"
                    value={actorId}
                    onChange={(e) => setActorId(e.target.value)}
                    className={`w-full cursor-pointer appearance-none truncate rounded-lg border py-2 pr-9 pl-4 text-sm font-medium text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brass/40 ${
                      actorId ? "border-brass bg-brass/10" : "border-stone/25 bg-white hover:border-stone/40"
                    }`}
                  >
                    <option value="">Tất cả</option>
                    {actors.map((actor) => (
                      <option key={actor.UserID} value={actor.UserID}>
                        {actor.fullName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-stone" />
                </div>
              </div>

              <div className="min-w-0 space-y-1.5">
                <label htmlFor="auditTimeRange" className="flex items-center gap-2 text-sm font-semibold text-stone">
                  <CalendarDays aria-hidden="true" className="h-4 w-4 text-stone" />
                  Thời gian
                </label>
                <div className="relative">
                  <select
                    id="auditTimeRange"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-lg border border-stone/25 bg-white py-2 pr-9 pl-4 text-sm font-medium text-ink outline-none transition-colors hover:border-stone/40 focus-visible:ring-2 focus-visible:ring-brass/40"
                  >
                    {TIME_RANGES.map((range) => (
                      <option key={range.key} value={range.key}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-stone" />
                </div>
              </div>
            </div>
          </div>

          {visibleLogs.length === 0 ? (
            <div className="mt-10 border-y border-stone/20 py-16 text-center text-stone">
              <SearchX className="mx-auto mb-3 h-10 w-10 text-stone/40" />
              Không có hoạt động nào phù hợp
            </div>
          ) : (
            // Khung hairline giống trang Báo cáo; mt-10 gộp với space-y-5 thành 40px, tách khỏi bộ lọc
            <div className="mt-10 rounded-lg border border-stone/15 bg-white px-4 py-5 sm:px-6">
              <p className="mb-5 text-sm text-stone">{visibleLogs.length} hoạt động</p>
              <ol>
                {visibleLogs.map((log, index) => (
                  <AuditLogItem key={log.LogID} log={log} isLast={index === visibleLogs.length - 1} />
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
