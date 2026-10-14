import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, SearchX } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import LoadingState from "../../components/LoadingState";
import TrainingBadge from "../../components/TrainingBadge";
import useApiResource from "../../hooks/useApiResource";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { getHorses, getTrainingPlans } from "../../services/trainingApi";
import { formatDate } from "../../utils/date";
import { formatNumber } from "../../utils/trainingFormat";

const TH = "px-4 py-2.5 text-xs font-medium text-stone whitespace-nowrap";
const TD = "px-4 py-3 align-top";

// Danh sách giáo án (GET /api/trainer/training-plans) — lọc theo ngựa + trạng thái phía BE (?horse=&status= trên URL),
// tìm theo tên giáo án phía FE. Bấm 1 dòng → chi tiết giáo án.
export default function TrainingPlans() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { options, label } = useTrainingOptions();
  const horseFilter = searchParams.get("horse") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState(state?.message ?? "");
  // Danh sách ngựa chỉ để lọc — lỗi thì bộ lọc ngựa trống, lỗi chính hiện ở danh sách giáo án
  const horsesResource = useApiResource(getHorses, "horses");
  const plansResource = useApiResource(
    () => getTrainingPlans({ horseId: horseFilter || undefined, status: statusFilter || undefined }),
    `${horseFilter}|${statusFilter}`
  );
  const horses = horsesResource.data ?? [];
  const plans = plansResource.data ?? [];
  const { loading, error } = plansResource;

  const retry = () => {
    horsesResource.reload();
    plansResource.reload();
  };

  const updateFilter = (name, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    setSearchParams(next, { replace: true });
  };

  const normalizedKeyword = keyword.trim().toLowerCase();
  const visiblePlans = plans.filter(
    (p) => p.planName.toLowerCase().includes(normalizedKeyword) || (p.horseName ?? "").toLowerCase().includes(normalizedKeyword)
  );
  const newPlanLink = horseFilter ? `/trainer/plans/new?horse=${horseFilter}` : "/trainer/plans/new";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Giáo án tập luyện</h1>
        <Link to={newPlanLink} className="btn-primary">
          + Lập giáo án
        </Link>
      </div>

      {message && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-sm border-l-2 border-green-700 bg-white/60 px-4 py-3 text-sm text-green-800">
          {message}
          <button type="button" onClick={() => setMessage("")} className="cursor-pointer font-semibold text-green-700 hover:underline">
            Đóng
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Lọc trạng thái dạng pill — "Tất cả" + 4 trạng thái giáo án */}
        <div role="radiogroup" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-1.5">
          {[{ code: "", label: "Tất cả" }, ...options.planStatuses].map((option) => {
            const active = statusFilter === option.code;
            return (
              <button
                key={option.code || "all"}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => updateFilter("status", option.code)}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active ? "border-brass bg-brass/15 font-medium text-brass-deep" : "border-stone/25 bg-white text-ink hover:border-stone/40"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <label htmlFor="planHorse" className="sr-only">
          Lọc theo ngựa
        </label>
        <select
          id="planHorse"
          value={horseFilter}
          onChange={(e) => updateFilter("horse", e.target.value)}
          className="cursor-pointer rounded-full border border-stone/20 bg-white px-4 py-2 text-sm text-ink outline-none focus:border-brass"
        >
          <option value="">Tất cả ngựa</option>
          {horses.map((horse) => (
            <option key={horse.horseId} value={horse.horseId}>
              {horse.name}
            </option>
          ))}
        </select>
        <div className="relative w-full sm:ml-auto sm:w-64">
          <label htmlFor="planKeyword" className="sr-only">
            Tìm theo tên giáo án hoặc tên ngựa
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" />
          <input
            id="planKeyword"
            type="search"
            placeholder="Tìm giáo án, ngựa..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ApiErrorNotice variant="page" error={error} onRetry={retry} />
      ) : visiblePlans.length === 0 ? (
        <div className="rounded-lg border border-stone/15 bg-white py-16 text-center text-stone">
          <SearchX className="mx-auto mb-3 h-10 w-10 text-stone/40" />
          {plans.length === 0 ? "Chưa có giáo án nào phù hợp bộ lọc." : "Không tìm thấy giáo án phù hợp."}
          <div className="mt-4">
            <Link to={newPlanLink} className="text-sm font-semibold text-brass-deep hover:underline">
              Lập giáo án mới →
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone/15 bg-white">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-stone/15">
              <tr>
                <th className={TH}>Giáo án</th>
                <th className={TH}>Ngựa</th>
                <th className={TH}>Thời gian</th>
                <th className={TH}>Cường độ cao nhất</th>
                <th className={TH}>Tiến độ</th>
                <th className={TH}>Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {visiblePlans.map((plan) => {
                const progress = plan.progress ?? {};
                const rate = Math.min(100, Number(progress.completionRate) || 0);
                return (
                  <tr
                    key={plan.planId}
                    onClick={() => navigate(`/trainer/plans/${plan.planId}`)}
                    className="cursor-pointer transition-colors hover:bg-brass/5"
                  >
                    <td className={TD}>
                      <Link
                        to={`/trainer/plans/${plan.planId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-serif font-semibold text-ink hover:text-brass-deep"
                      >
                        {plan.planName}
                      </Link>
                      <p className="mt-0.5 text-xs text-stone">
                        {plan.trainingType ? label("planTypes", plan.trainingType) : "Chưa chọn loại"}
                        {plan.objective ? ` · ${plan.objective}` : ""}
                      </p>
                    </td>
                    <td className={`${TD} font-medium whitespace-nowrap text-ink`}>{plan.horseName}</td>
                    <td className={`${TD} whitespace-nowrap`}>
                      {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
                      <span className="block text-xs text-stone">{plan.phaseCount} giai đoạn</span>
                    </td>
                    <td className={TD}>
                      {plan.intensityLevel ? (
                        <TrainingBadge kind="intensity" code={plan.intensityLevel}>
                          {label("intensityLevels", plan.intensityLevel)}
                        </TrainingBadge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`${TD} min-w-40`}>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
                          <div className="h-full rounded-full bg-moss" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-medium text-ink tabular-nums">{formatNumber(progress.completionRate ?? 0)}%</span>
                      </div>
                      <p className="mt-1 text-xs text-stone">
                        {progress.completedSessions ?? 0}/{(progress.totalSessions ?? 0) - (progress.cancelledSessions ?? 0)} buổi
                        {progress.averagePerformanceScore != null && ` · điểm TB ${formatNumber(progress.averagePerformanceScore)}`}
                      </p>
                    </td>
                    <td className={TD}>
                      <TrainingBadge kind="planStatus" code={plan.status}>
                        {label("planStatuses", plan.status)}
                      </TrainingBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-stone/15 px-4 py-2.5 text-xs text-stone">{visiblePlans.length} giáo án</p>
        </div>
      )}
    </div>
  );
}
