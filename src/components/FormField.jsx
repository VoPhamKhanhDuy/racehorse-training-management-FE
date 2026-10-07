import { useState } from "react";

// Ô nhập liệu có nhãn + thông báo lỗi. type="password" sẽ có nút ẩn/hiện mật khẩu.
export default function FormField({ label, id, type = "text", error, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-600">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl px-4 py-3 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 autofill:shadow-[inset_0_0_0_1000px_#f9fafb] autofill:[-webkit-text-fill-color:#232328] ${
            isPassword ? "pr-12" : ""
          } ${
            error
              ? "bg-red-50 ring-1 ring-red-300 focus:ring-red-300"
              : "bg-gray-50 focus:ring-[#F2A71B]"
          }`}
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
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
