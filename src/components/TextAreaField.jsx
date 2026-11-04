// Ô nhập nhiều dòng có nhãn + lỗi + bộ đếm ký tự, cùng kiểu FormField variant="outline".
// maxLength: hiện bộ đếm "x/maxLength" và chặn gõ quá giới hạn.
export default function TextAreaField({ label, id, error, value = "", maxLength, rows = 3, hint, ...textareaProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-serif text-sm font-semibold text-stone">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={`w-full resize-y rounded-md border bg-white px-3.5 py-2.5 text-ink outline-none transition-colors placeholder:text-stone/50 focus:ring-2 focus:ring-brass/20 disabled:cursor-not-allowed disabled:bg-stone/5 ${
          error ? "border-alert focus:ring-alert/20" : "border-stone/25 focus:border-brass"
        }`}
        {...textareaProps}
      />
      <div className="mt-1 flex justify-between gap-4 text-xs">
        <span className={error ? "text-sm text-alert" : "text-stone"}>{error || hint}</span>
        {maxLength && (
          <span className="shrink-0 text-stone tabular-nums">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
