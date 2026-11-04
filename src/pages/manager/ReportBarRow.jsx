// 1 dòng của bảng xếp hạng / bảng tỷ trọng trong trang Báo cáo:
// tên (serif) · thanh ngang phẳng · số liệu bên phải. Màu chỉ nằm ở thanh, không chấm/legend.
// ratio: 0..1 — độ dài phần tô của thanh. color: màu tô (hex, var(--color-...) hoặc color-mix).
// trackColor: nền phần chưa tô — mặc định là chính màu tô pha 14%.
export default function ReportBarRow({ label, ratio, color, trackColor, value, detail }) {
  const width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;

  return (
    <li className="flex items-center gap-3 border-b border-stone/15 py-2.5 last:border-b-0">
      <span className="w-24 shrink-0 truncate font-serif text-[0.9375rem] font-semibold text-ink sm:w-28" title={label}>
        {label}
      </span>
      {/* Thanh phẳng: bo 1px */}
      <span
        aria-hidden="true"
        className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-[1px]"
        style={{ backgroundColor: trackColor ?? `color-mix(in srgb, ${color} 14%, transparent)` }}
      >
        <span className="block h-full" style={{ width, backgroundColor: color }} />
      </span>
      <span className="shrink-0 text-right text-sm whitespace-nowrap tabular-nums">
        <span className="font-medium text-ink">{value}</span>
        {detail && <span className="ml-2 inline-block w-9 text-stone">{detail}</span>}
      </span>
    </li>
  );
}
