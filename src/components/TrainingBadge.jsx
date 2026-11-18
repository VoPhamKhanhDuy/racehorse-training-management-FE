// Nhãn "pill" cho mã của luồng giáo án: trạng thái giáo án / buổi tập, cường độ, mức sẵn sàng thể trạng.
// Chữ hiển thị truyền qua children (nhãn tiếng Việt), màu theo kind + code.
const BADGE_COLORS = {
  planStatus: {
    Draft: "bg-stone/10 text-stone",
    Active: "bg-green-50 text-green-700",
    Completed: "bg-[#4373a3]/10 text-[#4373a3]",
    Cancelled: "bg-[#9e5954]/10 text-[#9e5954]",
  },
  sessionStatus: {
    Scheduled: "bg-brass/15 text-brass-deep",
    InProgress: "bg-[#4373a3]/10 text-[#4373a3]",
    Completed: "bg-green-50 text-green-700",
    Cancelled: "bg-stone/10 text-stone",
  },
  intensity: {
    Recovery: "bg-[#5c7a3f]/10 text-[#5c7a3f]",
    Low: "bg-[#4373a3]/10 text-[#4373a3]",
    Medium: "bg-[#946330]/10 text-[#946330]",
    High: "bg-[#9e5954]/10 text-[#9e5954]",
  },
  readiness: {
    Ready: "bg-green-50 text-green-700",
    Limited: "bg-[#946330]/10 text-[#946330]",
    RecoveryOnly: "bg-[#9e5954]/10 text-[#9e5954]",
    NotAllowed: "bg-alert/10 text-alert",
  },
};

export default function TrainingBadge({ kind, code, children }) {
  const className = BADGE_COLORS[kind]?.[code] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}
