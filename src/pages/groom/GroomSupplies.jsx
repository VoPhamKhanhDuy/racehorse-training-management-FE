import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import TablePager from "../../components/TablePager";
import SupplyStockRow from "./SupplyStockRow";
import { getSupplies } from "../../services/supplyService";
import { SUPPLY_STATES, getSupplyState } from "../../config/supplyConfig";

const PAGE_SIZE = 10;
// Header bảng trung tính: nền #F5F5F5, chữ #1f1f1f weight 600 13px, kẻ ô dọc #E3E3E3 (ô cuối không kẻ)
const HEAD = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const FIELD =
  "h-10 w-full rounded-[4px] border border-[#E3E3E3] bg-white text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]";
const byName = (a, b) => a.TenVatTu.localeCompare(b.TenVatTu, "vi");

// Tồn kho vật tư (SUPPLY) cho nhân viên chăm sóc — chỉ xem, Quản lý CLB mới thêm/sửa/nhập/xuất.
// Một bảng: vật tư cần bổ sung (Hết hàng trước, rồi Sắp hết) xếp trên cùng, sau đó từng Loai.
// Lọc: ô tìm theo tên + dropdown "Nhóm" (Loai lấy từ dữ liệu, kèm số lượng) — cùng logic lọc như các tab trước đây.
export default function GroomSupplies() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [activeType, setActiveType] = useState(null); // null = Tất cả
  const [page, setPage] = useState(1);

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

  const types = [...new Set(supplies.map((s) => s.Loai).filter(Boolean))];
  const needsRestock = (s) => getSupplyState(s) !== SUPPLY_STATES.OK;

  const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");
  const visible = supplies.filter(
    (s) => (!activeType || s.Loai === activeType) && (!normalizedKeyword || s.TenVatTu.toLocaleLowerCase("vi").includes(normalizedKeyword))
  );

  // Hết hàng trước Sắp hết, cùng tình trạng thì theo tên
  const outFirst = (a, b) => Number(getSupplyState(b) === SUPPLY_STATES.OUT) - Number(getSupplyState(a) === SUPPLY_STATES.OUT) || byName(a, b);
  const groups = [
    { key: "restock", items: visible.filter(needsRestock).sort(outFirst) },
    ...types.map((type) => ({ key: type, items: visible.filter((s) => s.Loai === type && !needsRestock(s)).sort(byName) })),
  ].filter((g) => g.items.length > 0);

  // Danh sách phẳng giữ nguyên thứ tự các nhóm ở trên
  const rows = groups.flatMap((g) => g.items);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Vật tư</h1>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : (
        <>
          {/* Một hàng: ô tìm kiếm + dropdown Nhóm */}
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
                    {type} ({supplies.filter((s) => s.Loai === type).length})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="mt-5 rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">Không tìm thấy vật tư nào.</p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
              {/* table-layout: fixed; tiêu đề và hàng chung một lưới cột 40 / 20 / 20 / 20, không cuộn ngang */}
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style={{ width: "40%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead>
                  <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
                    <th className={HEAD}>Tên vật tư</th>
                    <th className={HEAD}>Nhóm</th>
                    <th className={`${HEAD} text-right`}>Số lượng</th>
                    <th className={HEAD}>Tình trạng</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {pageRows.map((item) => (
                    <SupplyStockRow key={item.SupplyID} item={item} />
                  ))}
                </tbody>
              </table>
              <TablePager page={currentPage} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} unit="vật tư" onPage={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
