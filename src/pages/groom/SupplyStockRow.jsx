import { SUPPLY_STATES, getSupplyState, supplyDisplayName, supplyDisplayType, supplyMinimum, supplyUnit } from "../../config/supplyConfig";

// Ô bảng: kẻ ô 1px #E3E3E3 (ngang + dọc, ô cuối không kẻ dọc), padding 12px 16px, căn giữa dọc
const CELL = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// 1 vật tư = 1 hàng: STT | Tên | Nhóm | Số lượng | Mức tối thiểu.
// Thiếu hàng (số lượng ≤ mức tối thiểu): số lượng + đơn vị chữ đỏ #c0262d (số weight 600); hàng KHÔNG bấm được (yêu cầu bổ sung gửi bằng nút ở đầu trang).
// Đã có yêu cầu chờ xử lý (pending): chữ xám nhỏ "Đã gửi yêu cầu" cạnh tên.
export default function SupplyStockRow({ item, index, pending }) {
  const unit = supplyUnit(item);
  const low = getSupplyState(item) !== SUPPLY_STATES.OK;
  const name = supplyDisplayName(item);
  const type = supplyDisplayType(item.Loai);

  return (
    <tr className="h-[52px] bg-white transition-colors hover:bg-[#FAFAFA]">
      <td className={`${CELL} text-center text-[#6b6b6b] tabular-nums`}>{index}</td>
      <td className={CELL}>
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate font-medium" title={name}>
            {name}
          </span>
          {pending && <span className="shrink-0 text-xs text-[#6b6b6b]">Đã gửi yêu cầu</span>}
        </span>
      </td>
      <td className={`${CELL} text-[#6b6b6b]`}>
        <span className="block truncate" title={type}>
          {type}
        </span>
      </td>
      <td className={`${CELL} text-right whitespace-nowrap tabular-nums`}>
        <span className={low ? "text-[#c0262d]" : ""}>
          <span className="font-semibold">{item.SoLuongTon.toLocaleString("vi-VN")}</span>
          {unit && <span className={low ? "" : "text-[#6b6b6b]"}> {unit}</span>}
        </span>
      </td>
      <td className={`${CELL} text-right whitespace-nowrap text-[#6b6b6b] tabular-nums`}>
        {supplyMinimum(item).toLocaleString("vi-VN")}
        {unit && ` ${unit}`}
      </td>
    </tr>
  );
}
