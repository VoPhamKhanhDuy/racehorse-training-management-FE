// Cường độ dạng chữ, không nền/viền, tất cả font-semibold: Nhẹ chữ chính, Trung bình cam, Cao đỏ.
const INTENSITY_COLORS = {
  Recovery: "font-semibold text-[#2b2118]",
  Low: "font-semibold text-[#2b2118]",
  Medium: "font-semibold text-[#c2570c]",
  High: "font-semibold text-[#c0262d]",
};

export default function IntensityText({ code, children }) {
  return (
    <span className={`text-sm whitespace-nowrap ${INTENSITY_COLORS[code] ?? "font-semibold text-[#6b6055]"}`}>
      {children}
    </span>
  );
}
