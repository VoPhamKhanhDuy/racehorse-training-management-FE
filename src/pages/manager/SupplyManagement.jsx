import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layers, Package, PackageOpen, Search, SearchX, Tags } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import StockAdjustModal from "./StockAdjustModal";
import SupplyRow from "./SupplyRow";
import { adjustStock, deleteSupply, getStaffMembers, getSupplies } from "../../services/supplyService";

export default function SupplyManagement() {
  // Thông báo do form thêm/sửa vật tư gửi sang sau khi lưu thành công
  const { state } = useLocation();
  const [supplies, setSupplies] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "" = tất cả loại
  const [stockAction, setStockAction] = useState(null); // { supply, mode: "in" | "out" }
  const [supplyToDelete, setSupplyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(state?.message ?? "");

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock supplyService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getSupplies(), getStaffMembers()]).then(([supplyList, staffList]) => {
      if (ignore) return;
      setSupplies(supplyList);
      setStaffMembers(staffList);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Join SUPPLY.ManagedBy → USER để hiện tên người quản lý
  const managerNameById = Object.fromEntries(staffMembers.map((s) => [s.UserID, s.HoTen]));
  // Pill loại lấy động từ dữ liệu
  const supplyTypes = [...new Set(supplies.map((s) => s.Loai).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const typeFilters = [{ value: "", label: "Tất cả" }, ...supplyTypes.map((type) => ({ value: type, label: type }))];
  // Xóa hết vật tư của loại đang lọc thì pill đó biến mất → quay về "Tất cả"
  const activeType = supplyTypes.includes(typeFilter) ? typeFilter : "";

  // Số liệu tổng quan — tính trên toàn bộ vật tư, không phụ thuộc bộ lọc
  const totalStock = supplies.reduce((sum, s) => sum + s.SoLuongTon, 0);
  const stats = [
    { label: "Tổng mặt hàng", value: supplies.length, icon: Package },
    { label: "Tổng số lượng tồn", value: totalStock.toLocaleString("vi-VN"), icon: Layers },
    { label: "Số loại vật tư", value: supplyTypes.length, icon: Tags },
  ];

  // Tìm theo tên (không phân biệt hoa thường), kết hợp AND với lọc loại
  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleSupplies = supplies
    .filter(
      (s) => (!activeType || s.Loai === activeType) && s.TenVatTu.toLowerCase().includes(normalizedKeyword)
    )
    .sort((a, b) => a.TenVatTu.localeCompare(b.TenVatTu, "vi"));

  const handleStockSubmit = async (delta) => {
    const { supply } = stockAction;
    const updated = await adjustStock(supply.SupplyID, delta);
    setSupplies((prev) => prev.map((s) => (s.SupplyID === updated.SupplyID ? updated : s)));
    setStockAction(null);
    const amount = Math.abs(delta).toLocaleString("vi-VN");
    setMessage(
      delta > 0
        ? `Đã nhập kho ${amount} "${updated.TenVatTu}". Tồn kho: ${updated.SoLuongTon.toLocaleString("vi-VN")}.`
        : `Đã xuất kho ${amount} "${updated.TenVatTu}". Tồn kho: ${updated.SoLuongTon.toLocaleString("vi-VN")}.`
    );
  };

  const handleConfirmDelete = async () => {
    const supply = supplyToDelete;
    setDeleting(true);
    await deleteSupply(supply.SupplyID);
    setSupplies((prev) => prev.filter((s) => s.SupplyID !== supply.SupplyID));
    setDeleting(false);
    setSupplyToDelete(null);
    setMessage(`Đã xóa vật tư "${supply.TenVatTu}".`);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Quản lý vật tư</h1>
          <p className="mt-1 text-stone">Thức ăn, thuốc men và dụng cụ trong kho của câu lạc bộ.</p>
        </div>
        <Link
          to="/manager/supplies/new"
          className="rounded-sm bg-brass px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brass/85"
        >
          + Thêm vật tư mới
        </Link>
      </div>

      {message && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-sm border-l-2 border-green-700 bg-white/60 px-4 py-3 text-sm text-green-800">
          {message}
          <button
            type="button"
            onClick={() => setMessage("")}
            className="cursor-pointer font-semibold text-green-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          {/* Dải số liệu trong 1 card trắng (giống /manager/staff); vạch dọc ngăn từng ô */}
          <div className="grid grid-cols-3 divide-x divide-stone/20 overflow-hidden rounded-lg border border-stone/15 bg-white shadow-sm">
            {stats.map((stat) => (
              <div key={stat.label} className="px-4 py-3 sm:px-5">
                <p className="text-xs font-medium text-stone sm:text-sm">{stat.label}</p>
                <p className="mt-0.5 flex items-center gap-2 font-serif text-[1.75rem] leading-tight font-semibold text-ink">
                  <stat.icon className="h-5 w-5 shrink-0 text-stone" aria-hidden="true" />
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {/* Ô tìm kiếm cùng kiểu /manager/staff */}
            <div className="relative w-full sm:w-80">
              <label htmlFor="supplyKeyword" className="sr-only">
                Tìm theo tên vật tư
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" />
              <input
                id="supplyKeyword"
                type="search"
                placeholder="Tìm theo tên vật tư..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo loại vật tư">
              {typeFilters.map((f) => {
                const active = activeType === f.value;
                return (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => setTypeFilter(f.value)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-brass bg-brass/15 font-medium text-brass-deep"
                        : "border-stone/25 bg-white text-ink hover:border-stone/40"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {visibleSupplies.length === 0 ? (
            <div className="mt-10 border-y border-stone/20 py-16 text-center text-stone">
              {/* Có từ khóa → không khớp tìm kiếm; không có → loại đang lọc chưa có vật tư */}
              {normalizedKeyword ? (
                <>
                  <SearchX className="mx-auto mb-3 h-10 w-10 text-stone/40" />
                  Không tìm thấy vật tư phù hợp
                </>
              ) : (
                <>
                  <PackageOpen className="mx-auto mb-3 h-10 w-10 text-stone/40" />
                  Chưa có vật tư nào.
                </>
              )}
            </div>
          ) : (
            // Bảng kỷ luật giống /manager/staff: hairline, không zebra, không độ rộng cứng.
            // Bớt cột theo màn hình: dưới xl ẩn Người quản lý, dưới md ẩn Loại, dưới sm ẩn Số lượng tồn (2 cột này hiện dưới tên).
            // mt-10 gộp với lề 20px của space-y-5 thành 40px, tách rõ bảng khỏi pill lọc.
            <div className="mt-10 overflow-x-auto bg-white">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="whitespace-nowrap text-stone">
                  <tr>
                    <th className="border-b border-b-stone/20 px-4 py-3 font-medium">Tên vật tư</th>
                    <th className="hidden border-b border-b-stone/20 px-4 py-3 font-medium md:table-cell">Loại</th>
                    <th className="hidden border-b border-b-stone/20 px-4 py-3 text-right font-medium sm:table-cell">Số lượng tồn</th>
                    <th className="hidden border-b border-b-stone/20 px-4 py-3 font-medium xl:table-cell">Người quản lý</th>
                    <th className="sticky right-0 border-b border-b-stone/20 bg-white py-3 pr-4 pl-6 text-right font-medium">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSupplies.map((supply) => (
                    <SupplyRow
                      key={supply.SupplyID}
                      supply={supply}
                      managerName={managerNameById[supply.ManagedBy]}
                      onStockIn={(s) => setStockAction({ supply: s, mode: "in" })}
                      onStockOut={(s) => setStockAction({ supply: s, mode: "out" })}
                      onDelete={setSupplyToDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {stockAction && (
        <StockAdjustModal
          key={`${stockAction.supply.SupplyID}-${stockAction.mode}`}
          supply={stockAction.supply}
          mode={stockAction.mode}
          onSubmit={handleStockSubmit}
          onClose={() => setStockAction(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(supplyToDelete)}
        title="Xóa vật tư"
        message={`Bạn có chắc muốn xóa vật tư "${supplyToDelete?.TenVatTu ?? ""}"? Thao tác này không thể hoàn tác.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSupplyToDelete(null)}
      />
    </div>
  );
}
