import ReportBarRow from "./ReportBarRow";
import ReportPanel from "./ReportPanel";
import { formatCompactCurrency } from "../../utils/currency";

// Màu thanh cố định theo loại — 1 bộ màu ấm/đất chọn riêng cho EquiTrack, không pha màu lạnh:
// Dụng cụ = cam brass (màu nút chính), Thức ăn = nâu cam đất (brass-deep), Y tế = vàng đất mustard.
// Nền thanh chung 1 màu be nhạt. Màu chỉ nằm ở thanh, tên loại vẫn là chữ thường.
const BAR_TRACK = "color-mix(in srgb, var(--color-brass) 14%, transparent)";
const TYPE_COLORS = {
  "Dụng cụ": "var(--color-brass)",
  "Thức ăn": "var(--color-brass-deep)",
  "Y tế": "#d4ad4a",
};
// Loại mới thêm sau này (chưa có màu riêng): cam brass pha nhạt, vẫn cùng tông ấm
const FALLBACK_COLOR = "color-mix(in srgb, var(--color-brass) 55%, white)";

const formatShare = (share) => `${Math.round(share * 100)}%`;

// Nửa "Tài chính vật tư": giá trị tồn kho (Σ SoLuongTon × DonGia) + bảng tỷ trọng theo loại vật tư
export default function SupplyFinanceReport({ report }) {
  const topType = report.valueByType[0];
  const metrics = [
    { label: "Giá trị tồn kho", value: formatCompactCurrency(report.totalValue), hint: `${report.supplyCount} mặt hàng` },
    {
      label: "Giá trị cao nhất",
      value: report.topSupply ? formatCompactCurrency(report.topSupply.value) : "—",
      hint: report.topSupply?.name,
    },
    {
      label: "Loại lớn nhất",
      value: topType?.type ?? "—",
      hint: topType ? `${formatShare(topType.share)} giá trị kho` : undefined,
    },
  ];

  return (
    <ReportPanel
      title="Tài chính vật tư"
      description="Giá trị hàng trong kho tính theo đơn giá hiện tại."
      metrics={metrics}
    >
      <h3 className="text-sm font-medium text-stone">Giá trị tồn kho theo loại</h3>
      {/* Độ dài thanh = tỷ trọng trên tổng giá trị kho */}
      <ul className="mt-1">
        {report.valueByType.map((entry) => (
          <ReportBarRow
            key={entry.type}
            label={entry.type}
            ratio={entry.share}
            color={TYPE_COLORS[entry.type] ?? FALLBACK_COLOR}
            trackColor={BAR_TRACK}
            value={formatCompactCurrency(entry.value)}
            detail={formatShare(entry.share)}
          />
        ))}
      </ul>
    </ReportPanel>
  );
}
