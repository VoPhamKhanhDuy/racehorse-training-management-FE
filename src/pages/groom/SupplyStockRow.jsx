import { SUPPLY_STATES, getSupplyConfig, getSupplyState } from "../../config/supplyConfig";

// Mẫu cột: Tên | Loại (chỉ hiện ở nhóm "Cần bổ sung", ẩn dưới 900px) | Tình trạng | Số lượng tồn (căn phải)
export const SUPPLY_GRID =
  "grid grid-cols-[minmax(0,1fr)_72px_96px] items-center gap-x-4 min-[900px]:grid-cols-[minmax(0,1fr)_170px_80px_110px]";

// 1 vật tư = 1 hàng ~52px, chỉ xem (không bấm được). showType: hiện Loại (nhóm "Cần bổ sung").
export default function SupplyStockRow({ item, showType }) {
  const state = getSupplyState(item);
  const donVi = item.DonVi || getSupplyConfig(item.TenVatTu).donVi;

  return (
    <li className={`min-h-[52px] border-b border-stone/15 py-2.5 pr-2 pl-3 text-sm transition-colors hover:bg-[#faf6ee] ${SUPPLY_GRID}`}>
      <span className="truncate text-[15px] text-ink" title={item.TenVatTu}>
        {item.TenVatTu}
      </span>
      <span className="hidden truncate text-stone min-[900px]:block">{showType ? item.Loai : ""}</span>
      <span className="text-xs font-semibold text-brass-deep">{state === SUPPLY_STATES.OK ? "" : state}</span>
      <span className="text-right whitespace-nowrap tabular-nums">
        <span className="text-ink">{item.SoLuongTon.toLocaleString("vi-VN")}</span>
        {donVi && <span className="text-stone"> {donVi}</span>}
      </span>
    </li>
  );
}
