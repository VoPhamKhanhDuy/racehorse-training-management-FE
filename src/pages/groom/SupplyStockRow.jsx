import { Check, TriangleAlert } from "lucide-react";
import { SUPPLY_STATES, getSupplyConfig, getSupplyState } from "../../config/supplyConfig";

const CELL = "border-b border-[#d9cfba] px-4 py-3";

// 1 vật tư = 1 hàng bảng, chỉ xem (không bấm được): Tên | Nhóm | Số lượng | Tình trạng.
// Cần bổ sung (sắp hết / hết hàng): vạch trái 3px cam + nền kem nhạt.
export default function SupplyStockRow({ item }) {
  const state = getSupplyState(item);
  const donVi = item.DonVi || getSupplyConfig(item.TenVatTu).donVi;
  const restock = state !== SUPPLY_STATES.OK;

  return (
    <tr className={`text-[#2b2118] transition-colors hover:bg-[#f0efec] ${restock ? "bg-[#fdf8ef]" : ""}`}>
      <td className={`${CELL} max-w-0 border-l-[3px] ${restock ? "border-l-[#c2570c]" : "border-l-transparent"}`}>
        <span className="block truncate text-[15px] font-semibold" title={item.TenVatTu}>
          {item.TenVatTu}
        </span>
      </td>
      <td className={`${CELL} w-[140px] min-w-[140px] text-sm whitespace-nowrap text-[#4a3f33]`}>{item.Loai}</td>
      <td className={`${CELL} w-[140px] min-w-[140px] text-right whitespace-nowrap tabular-nums`}>
        <span className="text-[15px] font-semibold">{item.SoLuongTon.toLocaleString("vi-VN")}</span>
        {donVi && <span className="text-sm text-[#6b6055]"> {donVi}</span>}
      </td>
      <td className={`${CELL} w-[160px] min-w-[160px] text-sm whitespace-nowrap`}>
        {state === SUPPLY_STATES.OK ? (
          <span className="flex items-center gap-1.5 font-semibold text-[#4d6b2a]">
            <Check className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            Đủ
          </span>
        ) : (
          <span className={`flex items-center gap-1.5 font-semibold ${state === SUPPLY_STATES.OUT ? "text-[#c0262d]" : "text-[#c2570c]"}`}>
            <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            {state === SUPPLY_STATES.OUT ? state : "Cần bổ sung"}
          </span>
        )}
      </td>
    </tr>
  );
}
