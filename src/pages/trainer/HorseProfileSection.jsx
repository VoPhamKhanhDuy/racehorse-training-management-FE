import { Link } from "react-router-dom";

// Khung 1 mục trong hồ sơ ngựa: viền 1px #d9cfba, nền trắng, bo 4px, padding 20px 24px, tiêu đề serif 17px.
// link: liên kết chữ cuối mục ({ to, label }). className: thứ tự hiển thị trên mobile (order-*).
export default function HorseProfileSection({ title, link, className = "", children }) {
  return (
    <section aria-label={title} className={`min-w-0 rounded border border-[#d9cfba] bg-white px-6 py-5 ${className}`}>
      <h2 className="font-serif text-[17px] font-semibold text-[#2b2118]">{title}</h2>
      <div className="mt-3">{children}</div>
      {link && (
        <Link to={link.to} className="mt-3 inline-block text-sm font-medium text-[#c2570c] underline-offset-2 hover:underline">
          {link.label}
        </Link>
      )}
    </section>
  );
}
