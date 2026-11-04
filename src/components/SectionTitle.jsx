// Tiêu đề mục dùng chung cho các trang role Chủ ngựa (Chi phí, Sức khỏe, Lịch trình, chi tiết ngựa):
// đường kẻ ngang 1px màu mực phía trên (cách chữ 14px) + chữ serif 22px đậm 600, sentence case, không icon / nền / vạch màu.
// subtitle: dòng phụ 13px màu nhạt ngay dưới tiêu đề (vd "Tính đến …"). Phía dưới cách 16px tới bảng / nội dung.
// Khoảng cách giữa 2 mục (56px phía trên đường kẻ) đặt ở thẻ <section> bọc ngoài (className "mt-14").
// action: nút / bộ lọc nằm cùng hàng tiêu đề, canh phải.
export default function SectionTitle({ children, subtitle, action, as: Tag = "h2", className = "" }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 border-t border-[#2b2118] pt-3.5 ${className}`}>
      <div className="min-w-0">
        <Tag className="font-serif text-[22px] leading-snug font-semibold text-[#2b2118]">{children}</Tag>
        {subtitle && <p className="mt-1 text-[13px] text-stone/70">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
