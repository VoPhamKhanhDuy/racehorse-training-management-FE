import { useState } from "react";

// Class theo kiểu hiển thị:
// - "filled" (mặc định): ô nền xám bo tròn, viền cam khi focus — dùng ở Login/Register/...
// - "line": kiểu "điền form giấy", chỉ có gạch chân, focus đổi màu cam (giao diện mới, đang thử)
const variantStyles = {
  filled: {
    label: "mb-1.5 block text-sm font-medium text-gray-600",
    input:
      "w-full rounded-xl px-4 py-3 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 autofill:shadow-[inset_0_0_0_1000px_#f9fafb] autofill:[-webkit-text-fill-color:#232328]",
    inputState: (error) =>
      error ? "bg-red-50 ring-1 ring-red-300 focus:ring-red-300" : "bg-gray-50 focus:ring-[#F2A71B]",
    iconPadding: "pl-11",
    iconBox: "w-11 text-gray-400",
    error: "text-red-500",
  },
  line: {
    label: "mb-1 block font-serif text-sm font-semibold text-stone",
    input:
      "w-full border-b bg-transparent px-1 py-2 text-ink outline-none transition-colors placeholder:text-stone/50 autofill:shadow-[inset_0_0_0_1000px_var(--color-parchment)] autofill:[-webkit-text-fill-color:var(--color-ink)]",
    inputState: (error) => (error ? "border-alert" : "border-stone/50 focus:border-brass"),
    iconPadding: "pl-8",
    iconBox: "w-7 text-stone",
    error: "text-alert",
  },
  // "outline": viền đủ 4 cạnh, bo nhẹ, focus viền cam — đồng bộ với ô tìm kiếm ở các trang danh sách (dùng trong card form)
  outline: {
    label: "mb-1.5 block font-serif text-sm font-semibold text-stone",
    input:
      "w-full rounded-md border bg-white px-3.5 py-2.5 text-ink outline-none transition-colors placeholder:text-stone/50 focus:ring-2 focus:ring-brass/20 disabled:cursor-not-allowed disabled:bg-stone/5 disabled:text-stone",
    inputState: (error) => (error ? "border-alert focus:ring-alert/20" : "border-stone/25 focus:border-brass"),
    iconPadding: "pl-10",
    iconBox: "w-10 text-stone",
    error: "text-alert",
  },
};

// Ô nhập liệu có nhãn + thông báo lỗi. type="password" sẽ có nút ẩn/hiện mật khẩu.
// leadingIcon: icon hiển thị bên trái ô (vd kính lúp cho ô tìm kiếm)
export default function FormField({ label, id, type = "text", error, leadingIcon, variant = "filled", ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const styles = variantStyles[variant] ?? variantStyles.filled;

  return (
    <div>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className="relative">
        {leadingIcon && (
          <span className={`pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center ${styles.iconBox}`}>
            {leadingIcon}
          </span>
        )}
        <input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={Boolean(error)}
          className={`${styles.input} ${isPassword ? "pr-12" : ""} ${leadingIcon ? styles.iconPadding : ""} ${styles.inputState(error)}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#6E6E76] hover:text-[#232328]"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="M3 3l18 18" />}
            </svg>
          </button>
        )}
      </div>
      {error && <p className={`mt-1.5 text-sm ${styles.error}`}>{error}</p>}
    </div>
  );
}
