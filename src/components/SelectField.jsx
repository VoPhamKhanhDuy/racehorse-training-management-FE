// Class theo kiểu hiển thị, cùng 2 kiểu với FormField: "filled" (mặc định) và "line" (giao diện mới, đang thử)
const variantStyles = {
  filled: {
    label: "mb-1.5 block text-sm font-medium text-gray-600",
    select: "w-full cursor-pointer rounded-xl px-4 py-3 outline-none transition focus:bg-white focus:ring-2",
    selectState: (error) =>
      error ? "bg-red-50 ring-1 ring-red-300 focus:ring-red-300" : "bg-gray-50 focus:ring-[#F2A71B]",
    error: "text-red-500",
  },
  line: {
    label: "mb-1 block font-serif text-sm font-semibold text-stone",
    select: "w-full cursor-pointer border-b bg-transparent px-1 py-2 text-ink outline-none transition-colors",
    selectState: (error) => (error ? "border-alert" : "border-stone/50 focus:border-brass"),
    error: "text-alert",
  },
};

// Ô chọn (dropdown) có nhãn + lỗi, cùng style với FormField
export default function SelectField({ label, id, error, children, variant = "filled", ...selectProps }) {
  const styles = variantStyles[variant] ?? variantStyles.filled;

  return (
    <div>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={`${styles.select} ${styles.selectState(error)}`}
        {...selectProps}
      >
        {children}
      </select>
      {error && <p className={`mt-1.5 text-sm ${styles.error}`}>{error}</p>}
    </div>
  );
}
