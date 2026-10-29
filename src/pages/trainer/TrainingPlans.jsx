import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, SearchX } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import LoadingState from "../../components/LoadingState";
import { statusDisplayLabel } from "../../utils/statusLabels";
import TabFilter from "../../components/TabFilter";
import useApiResource from "../../hooks/useApiResource";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { getHorses, getTrainingPlans } from "../../services/trainingApi";
import PlanPagination from "./PlanPagination";
import TrainingPlanRow, { PLAN_BORDER, PLAN_HEAD_CELL, PLAN_ROW_GRID, PLAN_TABLE_MIN_WIDTH } from "./TrainingPlanRow";

const PAGE_SIZES = [5, 10, 20]; // số dòng mỗi trang (mặc định 10)
const COLUMNS = ["Ngựa", "Giáo án", "Thời gian", "Cường độ", "Tiến độ", "Trạng thái"];

// Danh sách giáo án (GET /api/trainer/training-plans) — lọc theo ngựa + trạng thái phía BE (?horse=&status= trên URL),
// tìm theo tên giáo án phía FE, phân trang phía FE trên mảng đã lọc. Bảng phẳng có khung; bấm 1 dòng → chi tiết giáo án.
export default function TrainingPlans() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { options } = useTrainingOptions();
  const horseFilter = searchParams.get("horse") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
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

  // Đổi tab / lọc ngựa → về trang 1
  const updateFilter = (name, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const normalizedKeyword = keyword.trim().toLowerCase();
  const visiblePlans = plans.filter(
    (p) => p.planName.toLowerCase().includes(normalizedKeyword) || (p.horseName ?? "").toLowerCase().includes(normalizedKeyword)
  );

  // Số đếm trên tab (chữ nhạt sau nhãn): đếm trên dữ liệu đã tải, trước khi tìm kiếm. API lọc trạng thái ở phía BE nên
  // chỉ biết số của mọi tab khi đang ở "Tất cả"; đang ở 1 tab trạng thái thì chỉ tab đó có số.
  const countOf = (code) => (code === "" ? plans.length : plans.filter((p) => p.status === code).length);
  const tabLabel = (code, text) => {
    if (statusFilter !== "" && statusFilter !== code) return text;
    const count = countOf(code);
    if (count === 0 && code !== "") return text;
    return (
      <>
        {text} <span className="text-xs font-normal text-[#6b6055]">{count}</span>
      </>
    );
  };

  // Phân trang: trang hiện tại luôn nằm trong [1, tổng trang] kể cả khi dữ liệu tải lại ít hơn
  const totalPages = Math.max(1, Math.ceil(visiblePlans.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedPlans = visiblePlans.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pagination = (
    <PlanPagination
      total={visiblePlans.length}
      page={currentPage}
      pageSize={pageSize}
      pageSizes={PAGE_SIZES}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
    />
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

      {/* 1 hàng: tab trạng thái ("Tất cả" + 4 trạng thái giáo án) bên trái, chọn ngựa + tìm kiếm bên phải;
          đường kẻ chạy hết chiều rộng bên dưới cả hàng */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[#ece5d6]">
        <TabFilter
          ariaLabel="Lọc theo trạng thái"
          options={[
            { code: "", label: tabLabel("", "Tất cả") },
            ...options.planStatuses.map((o) => ({ ...o, label: tabLabel(o.code, statusDisplayLabel(o.code, o.label)) })),
          ]}
          value={statusFilter}
          onChange={(code) => updateFilter("status", code)}
        />

        <div className="flex flex-wrap items-center gap-3 pb-2">
          <label htmlFor="planHorse" className="sr-only">
            Lọc theo ngựa
          </label>
          <select
            id="planHorse"
            value={horseFilter}
            onChange={(e) => updateFilter("horse", e.target.value)}
            className="h-9 cursor-pointer rounded border border-[#d9d0bf] bg-white px-3 text-sm text-[#2b2118] outline-none focus:border-[#c2570c]"
          >
            <option value="">Tất cả ngựa</option>
            {horses.map((horse) => (
              <option key={horse.horseId} value={horse.horseId}>
                {horse.name}
              </option>
            ))}
          </select>
          <div className="relative w-full sm:w-60">
            <label htmlFor="planKeyword" className="sr-only">
              Tìm theo tên giáo án hoặc tên ngựa
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" />
            <input
              id="planKeyword"
              type="search"
              placeholder="Tìm giáo án, ngựa..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded border border-[#d9d0bf] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none transition-colors placeholder:text-[#6b6055]/60 focus:border-[#c2570c]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ApiErrorNotice variant="page" error={error} onRetry={retry} />
      ) : (
        <div className={`overflow-x-auto rounded border bg-white ${PLAN_BORDER}`}>
          {visiblePlans.length === 0 ? (
            <>
              <div className="py-16 text-center text-[#6b6055]">
                <SearchX className="mx-auto mb-3 h-10 w-10 text-[#6b6055]/40" />
                {plans.length === 0 ? "Chưa có giáo án nào phù hợp bộ lọc." : "Không tìm thấy giáo án phù hợp."}
                <div className="mt-4">
                  <Link to={newPlanLink} className="text-sm font-semibold text-[#c2570c] hover:underline">
                    Lập giáo án mới →
                  </Link>
                </div>
              </div>
              {pagination}
            </>
          ) : (
            <div role="table" className={PLAN_TABLE_MIN_WIDTH}>
              <div role="row" className={`grid bg-[#4a3a2a] text-[13px] font-semibold text-[#f3ede0] ${PLAN_ROW_GRID}`}>
                {COLUMNS.map((column) => (
                  <div key={column} role="columnheader" className={PLAN_HEAD_CELL}>
                    {column}
                  </div>
                ))}
              </div>
              <div>
                {pagedPlans.map((plan) => (
                  <TrainingPlanRow key={plan.planId} plan={plan} onOpen={() => navigate(`/trainer/plans/${plan.planId}`)} />
                ))}
              </div>
              {pagination}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
