import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, Search, SearchX, UserRound } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import LoadingState from "../../components/LoadingState";
import AuditLogItem from "./AuditLogItem";
import useApiResource from "../../hooks/useApiResource";
import useAuth from "../../hooks/useAuth";
import { getAuditLogs } from "../../services/auditService";
import { getStaffAccounts } from "../../services/managerStaffService";
import { daysFromToday, todayISO } from "../../utils/date";

// Khoảng thời gian: ngày bắt đầu (tính cả hôm nay), gửi lên API thành from/to
const TIME_RANGES = [
  { key: "today", label: "Hôm nay", startDate: () => todayISO() },
  { key: "7d", label: "7 ngày qua", startDate: () => daysFromToday(-6) },
  { key: "30d", label: "30 ngày qua", startDate: () => daysFromToday(-29) },
];

const KEYWORD_DEBOUNCE_MS = 300;

// Lịch sử của 1 bộ lọc: trang đầu tải theo bộ lọc, "Xem thêm" nối các trang sau. Đổi bộ lọc → đổi key → tải lại từ trang 1.
function AuditTimeline({ filters }) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(null);
  const { data, error, loading, reload, setData } = useApiResource(() => getAuditLogs({ ...filters, page: 1 }), "first");

  const loadMore = async () => {
    setLoadingMore(true);
    setMoreError(null);
    try {
      const next = await getAuditLogs({ ...filters, page: data.page + 1 });
      setData((prev) => ({ ...next, items: [...prev.items, ...next.items] }));
    } catch (err) {
      setMoreError(err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ApiErrorNotice variant="page" error={error} onRetry={reload} />;
  if (!data) return null;

  if (data.items.length === 0) {
    return (
      <div className="mt-10 border-y border-stone/20 py-16 text-center text-stone">
        <SearchX className="mx-auto mb-3 h-10 w-10 text-stone/40" />
        Không có hoạt động nào phù hợp
      </div>
    );
  }

  const hasMore = data.items.length < data.total;
  return (
    // Khung hairline giống trang Báo cáo; mt-10 gộp với space-y-5 thành 40px, tách khỏi bộ lọc
    <div className="mt-10 rounded-lg border border-stone/15 bg-white px-4 py-5 sm:px-6">
      <p className="mb-5 text-sm text-stone">{data.total} hoạt động</p>
      <ol>
        {data.items.map((log, index) => (
          <AuditLogItem key={log.LogID} log={log} isLast={index === data.items.length - 1} />
        ))}
      </ol>
      {moreError && (
        <div className="mt-4">
          <ApiErrorNotice error={moreError} />
        </div>
      )}
      {hasMore && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "Đang tải..." : "Xem thêm"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AuditLog() {
  const { user } = useAuth();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [actorId, setActorId] = useState(""); // "" = mọi người
  const [timeRange, setTimeRange] = useState("30d");
  const { data: staff } = useApiResource(getStaffAccounts, "staff");

  // Gõ xong mới gọi API (tránh mỗi phím một request)
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput.trim()), KEYWORD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  // Người thực hiện: nhân sự nội bộ + chính Quản lý CLB đang đăng nhập
  const actors = [
    ...(user?.apiUserId ? [{ UserID: user.apiUserId, fullName: `${user.fullName} (tôi)` }] : []),
    ...(staff ?? []).map((s) => ({ UserID: s.id, fullName: s.fullName })),
  ].sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));

  const from = TIME_RANGES.find((r) => r.key === timeRange).startDate();
  const filters = { keyword, userId: actorId, from, to: todayISO() };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Nhật ký thao tác</h1>
      </div>

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
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
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

        <AuditTimeline key={`${keyword}|${actorId}|${timeRange}`} filters={filters} />
      </div>
    </div>
  );
}
