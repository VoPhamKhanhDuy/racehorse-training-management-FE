import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import SupplyStockRow from "./SupplyStockRow";
import { getSupplies } from "../../services/supplyService";
import { SUPPLY_STATES, getSupplyState } from "../../config/supplyConfig";

const GROUP_TITLE = "border-b border-stone/15 pt-5 pb-1.5 pl-3 text-xs font-medium tracking-wide text-stone uppercase select-none";
const byName = (a, b) => a.TenVatTu.localeCompare(b.TenVatTu, "vi");

// Tồn kho vật tư (SUPPLY) cho nhân viên chăm sóc — chỉ xem, Quản lý CLB mới thêm/sửa/nhập/xuất.
// Nhóm "Cần bổ sung" (Hết hàng trước, rồi Sắp hết) trên cùng, sau đó từng Loai; mỗi vật tư chỉ nằm ở 1 nhóm.
// Lọc: ô tìm theo tên + chip Loai (lấy từ dữ liệu, theo thứ tự xuất hiện).
export default function GroomSupplies() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [activeType, setActiveType] = useState(null); // null = Tất cả

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
  const restockTotal = supplies.filter(needsRestock).length;

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

  const chipClass = (active) =>
    `h-9 cursor-pointer rounded-full border px-3.5 text-sm transition-colors ${
      active ? "border-brass bg-brass/15 font-medium text-brass-deep" : "border-stone/25 bg-white text-ink hover:border-stone/40"
    }`;

  return (
    <div className="max-w-[900px]">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Vật tư</h1>
      {!loading && (
        <p className="mt-1 text-sm text-stone">
          {supplies.length} vật tư{restockTotal > 0 && ` · ${restockTotal} cần bổ sung`} · do Quản lý CLB cập nhật
        </p>
      )}

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <label htmlFor="supplyKeyword" className="sr-only">
                Tìm vật tư
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
              <input
                id="supplyKeyword"
                type="search"
                placeholder="Tìm vật tư..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-full border border-stone/20 bg-white pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>
            <button type="button" aria-pressed={!activeType} onClick={() => setActiveType(null)} className={chipClass(!activeType)}>
              Tất cả
            </button>
            {types.map((type) => (
              <button key={type} type="button" aria-pressed={activeType === type} onClick={() => setActiveType(type)} className={chipClass(activeType === type)}>
                {type}
              </button>
            ))}
          </div>

          {groups.length === 0 ? (
            <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">Không có vật tư nào khớp.</p>
          ) : (
            <div className="mt-2">
              {groups.map((group) => (
                <section key={group.key} aria-label={group.title}>
                  <h2 className={GROUP_TITLE}>
                    {group.title} · {group.items.length}
                  </h2>
                  <ul>
                    {group.items.map((item) => (
                      <SupplyStockRow key={item.SupplyID} item={item} showType={group.showType} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
