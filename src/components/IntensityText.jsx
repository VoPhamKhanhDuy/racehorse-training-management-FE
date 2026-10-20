// Cường độ dạng chữ 600, không nền/viền: Nhẹ xanh, Trung bình cam, Cao đỏ.
const INTENSITY_COLORS = {
  Recovery: "text-[#2f7d4f]",
  Low: "text-[#2f7d4f]",
  Medium: "text-[#d97706]",
  High: "text-[#c0262d]",
};

export default function IntensityText({ code, children }) {
  return (
    <span className={`text-sm font-semibold whitespace-nowrap ${INTENSITY_COLORS[code] ?? "text-[#6b6055]"}`}>
      {children}
    </span>
  );
}
