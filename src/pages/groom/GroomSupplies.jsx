import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import TablePager from "../../components/TablePager";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import SupplyRestockDialog from "./SupplyRestockDialog";
import SupplyRequestHistory from "./SupplyRequestHistory";
import SupplyStockRow from "./SupplyStockRow";
import { getSupplies } from "../../services/supplyService";
import { REQUEST_STATUS, createSupplyRequest, listSupplyRequests, subscribeSupplyRequests } from "../../services/supplyRequestMock";
import { SUPPLY_STATES, getSupplyState, supplyDisplayName, supplyDisplayType, supplyUnit } from "../../config/supplyConfig";

const PAGE_SIZE = 10;
// Header bảng trung tính: nền #F5F5F5, chữ #1f1f1f weight 600 13px, kẻ ô dọc #E3E3E3 (ô cuối không kẻ)
const HEAD = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const FIELD =
  "h-10 w-full rounded-[4px] border border-[#E3E3E3] bg-white text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]";
const byName = (a, b) => supplyDisplayName(a).localeCompare(supplyDisplayName(b), "vi");

// Tồn kho vật tư (SUPPLY) cho nhân viên chăm sóc — không sửa kho (việc của Quản lý CLB). KHÔNG có cột Tình trạng / Thao tác; dòng không bấm được. Dòng thiếu hàng (số lượng ≤ mức tối thiểu)
// có số lượng chữ đỏ; nút "Yêu cầu bổ sung" ở đầu trang mở khung chọn vật tư và gửi đến Quản lý CLB (MOCK services/supplyRequestMock.js, Quản lý xử lý ở /manager/supplies). Tên / nhóm / đơn vị hiển thị tiếng Việt qua config/supplyConfig.js.
// Một bảng: vật tư cần bổ sung (Hết hàng trước, rồi Sắp hết) xếp trên cùng, còn lại theo tên.
// Lọc: ô tìm theo tên + dropdown Nhóm + dropdown Tình trạng.
export default function GroomSupplies() {
  const { user } = useAuth();
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [activeType, setActiveType] = useState(null); // null = Tất cả
  const [stateFilter, setStateFilter] = useState(""); // "" | "restock" | "ok"
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState([]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let ignore = false;
    getSupplies()
      .then((list) => {
        if (ignore) return;
        setSupplies(list);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err.message || "Không tải được vật tư.");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const load = () => listSupplyRequests().then(setRequests);
    load();
    return subscribeSupplyRequests(load);
  }, []);
  const pendingOf = (supplyId) => requests.find((r) => r.supplyId === supplyId && r.status === REQUEST_STATUS.PENDING);

  const types = [...new Set(supplies.map((s) => s.Loai).filter(Boolean))].sort((a, b) => supplyDisplayType(a).localeCompare(supplyDisplayType(b), "vi"));
  const needsRestock = (s) => getSupplyState(s) !== SUPPLY_STATES.OK;

  const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");
  const visible = supplies.filter(
    (s) =>
      (!activeType || s.Loai === activeType) &&
      (!stateFilter || (stateFilter === "restock") === needsRestock(s)) &&
      (!normalizedKeyword ||
        supplyDisplayName(s).toLocaleLowerCase("vi").includes(normalizedKeyword) ||
        s.TenVatTu.toLocaleLowerCase("vi").includes(normalizedKeyword))
  );

  // Cần bổ sung trước (Hết hàng trước Sắp hết), rồi theo tên
  const rank = (s) => (getSupplyState(s) === SUPPLY_STATES.OUT ? 0 : needsRestock(s) ? 1 : 2);
  const rows = [...visible].sort((a, b) => rank(a) - rank(b) || byName(a, b));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const submitRequest = async ({ supply, quantity, note }) => {
    await createSupplyRequest({
      supplyId: supply.SupplyID,
      supplyName: supplyDisplayName(supply),
      unit: supplyUnit(supply),
      quantity,
      note,
      requestedBy: user.fullName,
    });
    setRequestOpen(false);
    setToast({ text: "Đã gửi yêu cầu bổ sung" });
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] md:px-8">
      <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Vật tư</h1>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : (
        <>
          {/* Một hàng: ô tìm kiếm + dropdown Nhóm + dropdown Tình trạng */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <label htmlFor="supplyKeyword" className="sr-only">
                Tìm vật tư
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
              <input
                id="supplyKeyword"
                type="search"
                placeholder="Tìm vật tư"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className={`${FIELD} pr-3 pl-9 placeholder:text-[#6b6b6b]/70`}
              />
            </div>
            <div className="relative w-full sm:w-56">
              <label htmlFor="supplyType" className="sr-only">
                Nhóm
              </label>
              <select
                id="supplyType"
                value={activeType ?? ""}
                onChange={(e) => {
                  setActiveType(e.target.value || null);
                  setPage(1);
                }}
                className={`${FIELD} cursor-pointer appearance-none pr-9 pl-3.5`}
              >
                <option value="">Tất cả nhóm</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {supplyDisplayType(type)} ({supplies.filter((s) => s.Loai === type).length})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
            </div>
            <div className="relative w-full sm:w-48">
              <label htmlFor="supplyState" className="sr-only">
                Tình trạng
              </label>
              <select
                id="supplyState"
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setPage(1);
                }}
                className={`${FIELD} cursor-pointer appearance-none pr-9 pl-3.5`}
              >
                <option value="">Tất cả tình trạng</option>
                <option value="restock">Cần bổ sung</option>
                <option value="ok">Đủ</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
            </div>
            <button type="button" onClick={() => setRequestOpen(true)} className="btn-primary w-full sm:ml-auto sm:w-auto">
              Yêu cầu bổ sung
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="mt-5 rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">Không tìm thấy vật tư nào.</p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
              {/* table-layout: fixed, không cuộn ngang */}
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "35%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "19%" }} />
                </colgroup>
                <thead>
                  <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
                    <th className={`${HEAD} text-center`}>STT</th>
                    <th className={HEAD}>Tên vật tư</th>
                    <th className={HEAD}>Nhóm</th>
                    <th className={`${HEAD} text-right`}>Số lượng</th>
                    <th className={`${HEAD} text-right`}>Mức tối thiểu</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {pageRows.map((item, i) => (
                    <SupplyStockRow
                      key={item.SupplyID}
                      item={item}
                      index={(currentPage - 1) * PAGE_SIZE + i + 1}
                      pending={pendingOf(item.SupplyID)}
                    />
                  ))}
                </tbody>
              </table>
              <TablePager page={currentPage} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} unit="vật tư" onPage={setPage} />
            </div>
          )}
          <SupplyRequestHistory requests={requests} userName={user.fullName} />
        </>
      )}

      {requestOpen && <SupplyRestockDialog supplies={supplies} requests={requests} onSubmit={submitRequest} onClose={() => setRequestOpen(false)} />}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
