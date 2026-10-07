// Icon đầu ngựa nét mảnh (lucide-react không có icon ngựa), cùng kiểu stroke với các icon lucide khác.
export default function HorseIcon({ className = "h-6 w-6", strokeWidth = 1.5 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Đầu + cổ ngựa nhìn nghiêng */}
      <path d="M16.5 3 15 5.5C10.5 6 7 9 5.5 13.2l-2 3.3a1.5 1.5 0 0 0 .6 2.1l1.3.7a1.5 1.5 0 0 0 1.9-.4L9 16.5h2.5L10 21h9.5V10c0-3.2-1.1-5.6-3-7Z" />
      {/* Bờm */}
      <path d="M16.5 3c.9 2.6.9 5 .2 7.5" />
      {/* Mắt */}
      <circle cx="13.5" cy="9.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
