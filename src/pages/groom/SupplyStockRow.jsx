import { SUPPLY_STATES, getSupplyConfig, getSupplyState } from "../../config/supplyConfig";

// Ô bảng: kẻ ô 1px #E3E3E3 (ngang + dọc, ô cuối không kẻ dọc), padding 12px 16px, căn giữa dọc
const CELL = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// 1 vật tư = 1 hàng bảng, chỉ xem (không bấm được): Tên | Nhóm | Số lượng | Tình trạng. Bảng trung tính, không tô nền hàng thiếu.
// Cần bổ sung (sắp hết): chữ cam đậm weight 600; Hết hàng: chữ đỏ weight 600; Đủ: chữ #1f1f1f weight 500.
export default function SupplyStockRow({ item }) {
  const state = getSupplyState(item);
  const donVi = item.DonVi || getSupplyConfig(item.TenVatTu).donVi;
  const restock = state !== SUPPLY_STATES.OK;

  return (
    <tr className="h-[52px] bg-white transition-colors hover:bg-[#FAFAFA]">
      <td className={CELL}>
        <span className="block truncate font-medium" title={item.TenVatTu}>
          {item.TenVatTu}
        </span>
      </td>
      <td className={`${CELL} text-[#6b6b6b]`}>
        <span className="block truncate" title={item.Loai}>
          {item.Loai}
        </span>
      </td>
      <td className={`${CELL} text-right whitespace-nowrap tabular-nums`}>
        <span className="font-medium">{item.SoLuongTon.toLocaleString("vi-VN")}</span>
        {donVi && <span className="text-[#6b6b6b]"> {donVi}</span>}
      </td>
      <td className={CELL}>
        {restock ? (
          <span className={`font-semibold whitespace-nowrap ${state === SUPPLY_STATES.OUT ? "text-[#c0262d]" : "text-[#c2570c]"}`}>
            {state === SUPPLY_STATES.OUT ? state : "Cần bổ sung"}
          </span>
        ) : (
          <span className="font-medium whitespace-nowrap">Đủ</span>
        )}
      </td>
    </tr>
  );
}
