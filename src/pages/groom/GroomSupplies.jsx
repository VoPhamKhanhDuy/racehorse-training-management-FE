import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import SupplyStockRow from "./SupplyStockRow";
import { getSupplies } from "../../services/supplyService";
import { SUPPLY_STATES, getSupplyState } from "../../config/supplyConfig";

const HEAD = "border-b border-[#b9ab90] bg-[#4a3a2a] px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-[#f3ede0]";
const byName = (a, b) => a.TenVatTu.localeCompare(b.TenVatTu, "vi");

// Tồn kho vật tư (SUPPLY) cho nhân viên chăm sóc — chỉ xem, Quản lý CLB mới thêm/sửa/nhập/xuất.
// Một bảng: vật tư cần bổ sung (Hết hàng trước, rồi Sắp hết) xếp trên cùng, sau đó từng Loai.
// Lọc: ô tìm theo tên + tab Loai (lấy từ dữ liệu, theo thứ tự xuất hiện).
export default function GroomSupplies() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [activeType, setActiveType] = useState(null); // null = Tất cả

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock supplyService)
  useEffect(() => {
    let ignore = false;
    getSupplies().then((list) => {
      if (ignore) return;
      setSupplies(list);
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
    { key: "restock", title: "Cần bổ sung", items: visible.filter(needsRestock).sort(outFirst), showType: true },
    ...types.map((type) => ({
      key: type,
      title: type,
      items: visible.filter((s) => s.Loai === type && !needsRestock(s)).sort(byName),
      showType: false,
    })),
  ].filter((g) => g.items.length > 0);

  // Danh sách phẳng giữ nguyên thứ tự các nhóm ở trên
  const rows = groups.flatMap((g) => g.items);
  const tabs = [
    { value: null, label: "Tất cả", count: supplies.length },
    ...types.map((type) => ({ value: type, label: type, count: supplies.filter((s) => s.Loai === type).length })),
  ];

  return (
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Vật tư</h1>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3 border-b border-[#d9cfba] pb-3 md:flex-row md:items-end md:justify-between md:gap-6 md:pb-0">
            <div className="flex flex-wrap gap-x-6" role="tablist" aria-label="Lọc theo nhóm vật tư">
              {tabs.map((t) => {
                const active = (activeType ?? null) === t.value;
                return (
                  <button
                    key={t.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveType(t.value)}
                    className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c] ${
                      active ? "border-[#c2570c] font-semibold text-[#2b2118]" : "border-transparent text-[#4a3f33] hover:text-[#2b2118]"
                    }`}
                  >
                    {t.label} <span className="tabular-nums">({t.count})</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:mb-2 md:w-64">
              <label htmlFor="supplyKeyword" className="sr-only">
                Tìm vật tư
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" aria-hidden="true" />
              <input
                id="supplyKeyword"
                type="search"
                placeholder="Tìm vật tư..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-[4px] border border-[#cfc4ad] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none placeholder:text-[#6b6055]/70 focus:border-[#c2570c]"
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="mt-5 rounded-[4px] border border-[#d9cfba] bg-white py-12 text-center text-sm text-[#4a3f33]">Không tìm thấy vật tư nào.</p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className={HEAD}>Tên vật tư</th>
                    <th className={HEAD}>Nhóm</th>
                    <th className={`${HEAD} text-right`}>Số lượng</th>
                    <th className={HEAD}>Tình trạng</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {rows.map((item) => (
                    <SupplyStockRow key={item.SupplyID} item={item} />
                  ))}
                </tbody>
              </table>
              <p className="border-t border-[#d9cfba] px-4 py-3 text-sm text-[#4a3f33] tabular-nums">
                Hiển thị {rows.length} / {supplies.length} vật tư
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
