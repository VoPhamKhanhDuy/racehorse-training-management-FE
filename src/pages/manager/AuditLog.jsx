import { useEffect, useState } from "react";
import { ChevronDown, Search, SearchX } from "lucide-react";
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

// Cùng kiểu pill lọc ở các trang danh sách
const pillClass = (active) =>
  `cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
    active ? "border-brass bg-brass/15 font-medium text-brass-deep" : "border-stone/25 bg-white text-ink hover:border-stone/40"
  }`;

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState(""); // "" = tất cả
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

  // Pill nhóm hành động lấy động từ dữ liệu
  const categories = [...new Set(logs.map((log) => log.category))].sort((a, b) => a.localeCompare(b, "vi"));
  const categoryFilters = [{ value: "", label: "Tất cả" }, ...categories.map((c) => ({ value: c, label: c }))];

  // Các bộ lọc kết hợp AND: từ khóa (người / hành động / đối tượng), nhóm, người thực hiện, khoảng thời gian
  const normalizedKeyword = keyword.trim().toLowerCase();
  const startDate = TIME_RANGES.find((r) => r.key === timeRange).startDate();
  const visibleLogs = logs.filter(
    (log) =>
      (!normalizedKeyword ||
        [log.actorName, log.HanhDong, log.targetName].some((text) => text.toLowerCase().includes(normalizedKeyword))) &&
      (!category || log.category === category) &&
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
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Ô tìm kiếm cùng kiểu các trang danh sách */}
              <div className="relative w-full sm:w-80">
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
                  className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
                />
              </div>

              {/* Dropdown dạng pill, cùng kiểu PillSelect ở bộ lọc hồ sơ ngựa */}
              <div className="relative">
                <label htmlFor="auditActor" className="sr-only">
                  Lọc theo người thực hiện
                </label>
                <select
                  id="auditActor"
                  value={actorId}
                  onChange={(e) => setActorId(e.target.value)}
                  className={`cursor-pointer appearance-none rounded-full border py-2 pr-9 pl-4 text-sm text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brass/40 ${
                    actorId ? "border-brass bg-brass/10" : "border-stone/25 bg-white hover:border-stone/40"
                  }`}
                >
                  <option value="">Mọi người thực hiện</option>
                  {actors.map((actor) => (
                    <option key={actor.UserID} value={actor.UserID}>
                      {actor.fullName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-stone" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo nhóm hành động">
              {categoryFilters.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setCategory(f.value)}
                  aria-pressed={category === f.value}
                  className={pillClass(category === f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Khoảng thời gian: có nhãn đứng trước như hàng "Sắp xếp theo" ở trang hồ sơ ngựa */}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Khoảng thời gian">
              <span className="mr-1 text-sm text-stone">Thời gian</span>
              {TIME_RANGES.map((range) => (
                <button
                  key={range.key}
                  type="button"
                  onClick={() => setTimeRange(range.key)}
                  aria-pressed={timeRange === range.key}
                  className={pillClass(timeRange === range.key)}
                >
                  {range.label}
                </button>
              ))}
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
