import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, SearchX } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import LoadingState from "../../components/LoadingState";
import { DataCell, DataRow, DataTable } from "../../components/DataTable";
import IntensityText from "../../components/IntensityText";
import StatusText from "../../components/StatusText";
import { statusDisplayLabel } from "../../utils/statusLabels";
import TabFilter from "../../components/TabFilter";
import useApiResource from "../../hooks/useApiResource";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { getHorses, getTrainingPlans } from "../../services/trainingApi";
import { formatDate } from "../../utils/date";
import { formatNumber } from "../../utils/trainingFormat";

const PLAN_GRID = "minmax(260px,2.2fr) 150px 190px 130px 170px 130px";
const COLUMNS = [
  { key: "plan", label: "Giáo án" },
  { key: "horse", label: "Ngựa" },
  { key: "time", label: "Thời gian" },
  { key: "intensity", label: "Cường độ cao nhất" },
  { key: "progress", label: "Tiến độ" },
  { key: "status", label: "Trạng thái" },
];

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-tight text-[#2b2118]">Giáo án tập luyện</h1>
          <p className="mt-1 text-sm text-[#6b6055]">Theo dõi giáo án, cường độ và tiến độ của từng ngựa.</p>
        </div>
        <Link
          to={newPlanLink}
          className="inline-flex h-10 items-center rounded bg-[#c2570c] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#a8480a]"
        >
          Lập giáo án
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

      {/* Lọc trạng thái dạng tab chữ — "Tất cả" + 4 trạng thái giáo án */}
      <TabFilter
        ariaLabel="Lọc theo trạng thái"
        options={[{ code: "", label: "Tất cả" }, ...options.planStatuses.map((o) => ({ ...o, label: statusDisplayLabel(o.code, o.label) }))]}
        value={statusFilter}
        onChange={(code) => updateFilter("status", code)}
      />

      <div className="mt-4 mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="planHorse" className="sr-only">
          Lọc theo ngựa
        </label>
        <select
          id="planHorse"
          value={horseFilter}
          onChange={(e) => updateFilter("horse", e.target.value)}
          className="h-10 cursor-pointer rounded border border-[#d9d0bf] bg-white px-3 text-sm text-[#2b2118] outline-none focus:border-[#c2570c]"
        >
          <option value="">Tất cả ngựa</option>
          {horses.map((horse) => (
            <option key={horse.horseId} value={horse.horseId}>
              {horse.name}
            </option>
          ))}
        </select>
        <div className="relative w-full sm:ml-auto sm:w-80">
          <label htmlFor="planKeyword" className="sr-only">
            Tìm theo tên giáo án hoặc tên ngựa
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" />
          <input
            id="planKeyword"
            type="search"
            placeholder="Tìm giáo án, ngựa..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-10 w-full rounded border border-[#d9d0bf] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none transition-colors placeholder:text-[#6b6055]/60 focus:border-[#c2570c]"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ApiErrorNotice variant="page" error={error} onRetry={retry} />
      ) : visiblePlans.length === 0 ? (
        <div className="border-y border-[#ece5d6] py-16 text-center text-[#6b6055]">
          <SearchX className="mx-auto mb-3 h-10 w-10 text-[#6b6055]/40" />
          {plans.length === 0 ? "Chưa có giáo án nào phù hợp bộ lọc." : "Không tìm thấy giáo án phù hợp."}
          <div className="mt-4">
            <Link to={newPlanLink} className="text-sm font-semibold text-[#c2570c] hover:underline">
              Lập giáo án mới →
            </Link>
          </div>
        </div>
      ) : (
        <DataTable columns={COLUMNS} template={PLAN_GRID} minWidth={1100} footer={`${visiblePlans.length} giáo án`}>
          {visiblePlans.map((plan) => {
            const progress = plan.progress ?? {};
            const rate = Math.min(100, Number(progress.completionRate) || 0);
            const subtitle = `${plan.trainingType ? label("planTypes", plan.trainingType) : "Chưa chọn loại"}${plan.objective ? ` · ${plan.objective}` : ""}`;
            return (
              <DataRow key={plan.planId} template={PLAN_GRID} onClick={() => navigate(`/trainer/plans/${plan.planId}`)}>
                <DataCell>
                  <Link
                    to={`/trainer/plans/${plan.planId}`}
                    onClick={(e) => e.stopPropagation()}
                    title={plan.planName}
                    className="block truncate font-serif font-semibold text-[#2b2118] hover:text-[#c2570c]"
                  >
                    {plan.planName}
                  </Link>
                  <p className="mt-0.5 truncate text-[13px] text-[#6b6055]" title={subtitle}>
                    {subtitle}
                  </p>
                </DataCell>
                <DataCell className="truncate font-medium whitespace-nowrap text-[#2b2118]" title={plan.horseName}>
                  {plan.horseName}
                </DataCell>
                <DataCell className="whitespace-nowrap">
                  {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
                  <span className="block text-xs text-[#6b6055]">{plan.phaseCount} giai đoạn</span>
                </DataCell>
                <DataCell>
                  {plan.intensityLevel ? (
                    <IntensityText code={plan.intensityLevel}>{label("intensityLevels", plan.intensityLevel)}</IntensityText>
                  ) : (
                    "—"
                  )}
                </DataCell>
                <DataCell>
                  <div className="h-1 overflow-hidden rounded-sm bg-[#ece5d6]">
                    <div className="h-full rounded-sm bg-[#6b7a3a]" style={{ width: `${rate}%` }} />
                  </div>
                  <p className="mt-1 truncate text-xs whitespace-nowrap text-[#6b6055]">
                    {progress.completedSessions ?? 0}/{(progress.totalSessions ?? 0) - (progress.cancelledSessions ?? 0)} buổi
                    {progress.averagePerformanceScore != null && ` · TB ${formatNumber(progress.averagePerformanceScore)}`}
                  </p>
                </DataCell>
                <DataCell>
                  <StatusText code={plan.status}>{label("planStatuses", plan.status)}</StatusText>
                </DataCell>
              </DataRow>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
