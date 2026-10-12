// Sparkline xu hướng (vd chỉ số tập các buổi gần đây, cũ → mới): đường 1.5px mực nâu, không chấm, không trục.
// Cần ít nhất 2 giá trị; ít hơn thì không vẽ gì.
export default function Sparkline({ values, width = 52, height = 16 }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Chừa 1px mỗi mép để nét 1.5px không bị cắt
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 2) + 1;
      const y = max === min ? height / 2 : height - 1 - ((v - min) / (max - min)) * (height - 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden="true" className="block">
      <polyline points={points} fill="none" stroke="var(--color-bark)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
