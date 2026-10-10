import { Link } from "react-router-dom";

// Khung 1 mục trong hồ sơ ngựa: hairline phía trên + tiêu đề serif 20px, không nền card.
// link: liên kết chữ cuối mục ({ to, label }). className: thứ tự hiển thị trên mobile (order-*).
export default function HorseProfileSection({ title, link, className = "", children }) {
  return (
    <section aria-label={title} className={`border-t border-stone/20 pt-4 ${className}`}>
      <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
      {link && (
        <Link
          to={link.to}
          className="mt-3 inline-block text-sm font-medium text-brass-deep underline-offset-2 hover:underline"
        >
          {link.label}
        </Link>
      )}
    </section>
  );
}
