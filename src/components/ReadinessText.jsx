// Mức sẵn sàng thể trạng dạng chữ 600, không nền/viền: Sẵn sàng xanh, Hạn chế cam, Chỉ phục hồi / Không được tập đỏ.
const READINESS_COLORS = {
  Ready: "text-[#2f7d4f]",
  Limited: "text-[#d97706]",
  RecoveryOnly: "text-[#c0262d]",
  NotAllowed: "text-[#c0262d]",
};

export default function ReadinessText({ code, children }) {
  return <span className={`text-sm font-semibold ${READINESS_COLORS[code] ?? "text-[#6b6055]"}`}>{children}</span>;
}
