import HorseAvatar from "../../components/HorseAvatar";
import { FEED_COMPONENTS } from "../../data/feedingOptions";

const TH = "border-r border-[#E3E3E3] px-[14px] text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const TD = "border-r border-b border-[#E3E3E3] px-[14px] py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";
const EMPTY = <span className="text-[#B5B5B5]">—</span>;

const formatNumber = (value) => (Math.round(value * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });

// Tổng khẩu phần cả ngày → "Cỏ 8 kg · Ngũ cốc 2 kg" ("" nếu không có)
export function dailyRationSummary(feeding) {
  return FEED_COMPONENTS.map((c) => {
    const total = feeding.reduce((sum, plan) => sum + Number(plan[c.field] || 0), 0);
    return total > 0 ? `${c.label} ${formatNumber(total)} ${c.unit}` : null;
  })
    .filter(Boolean)
    .join(" · ");
}

// Bảng các chuồng của 1 dãy (bảng trung tính: nền trắng, viền #E3E3E3, header #F5F5F5, kẻ ô, không zebra, hover #FAFAFA).
// rows: [{ stable, code, horse, feeding, condition }]; condition: { locked, health } — "Đang khóa tập" kèm chấm cam, còn lại chữ trung tính.
export default function StableGroupTable({ rows, onOpen }) {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "14%" }} />
        </colgroup>
        <thead>
          <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
            <th className={TH}>Chuồng</th>
            <th className={TH}>Ngựa</th>
            <th className={TH}>Khẩu phần mỗi ngày</th>
            <th className={TH}>Tình trạng</th>
            <th className={`${TH} text-center`}>Thao tác</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {rows.map(({ stable, code, horse, feeding, condition }) => {
            const name = horse?.Ten ?? `Ngựa #${stable.HorseID}`;
            const ration = dailyRationSummary(feeding);
            return (
              <tr key={stable.AssignmentID} className="h-14 bg-white transition-colors hover:bg-[#FAFAFA]">
                <td className={`${TD} font-semibold tabular-nums`}>{code}</td>
                <td className={TD}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <HorseAvatar horse={horse} size={32} square />
                    <span className="truncate font-semibold" title={name}>
                      {name}
                    </span>
                  </span>
                </td>
                <td className={TD}>
                  <span className="block truncate" title={ration || undefined}>
                    {ration || EMPTY}
                  </span>
                </td>
                <td className={TD}>
                  {condition.locked ? (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2570c]" aria-hidden="true" />
                      Đang khóa tập
                    </span>
                  ) : condition.health ? (
                    <span className="font-medium">{condition.health}</span>
                  ) : (
                    EMPTY
                  )}
                </td>
                <td className={`${TD} text-center`}>
                  <button
                    type="button"
                    onClick={() => onOpen(stable.AssignmentID)}
                    className="cursor-pointer text-sm font-medium text-[#c2570c] hover:underline"
                  >
                    Xem
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
