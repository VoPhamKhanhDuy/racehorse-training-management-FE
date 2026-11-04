// Nhóm chip chọn trong form khám bệnh, dùng input thật (ẩn) để bàn phím + trình đọc màn hình chạy sẵn.
// multiple = false: chọn một (radio), value là chuỗi; multiple = true: chọn nhiều (checkbox), value là mảng.
// renderOption(option): nội dung chip (mặc định là chính chuỗi option). disabledOption(option): khóa chip.
export default function ChoiceChips({
  legend,
  name,
  options,
  value,
  multiple = false,
  error,
  onChange,
  renderOption = (option) => option,
  getKey = (option) => option,
  disabledOption = () => false,
  hint,
}) {
  const isChecked = (key) => (multiple ? value.includes(key) : value === key);

  return (
    <fieldset aria-invalid={Boolean(error)}>
      <legend className="mb-1.5 block font-serif text-sm font-semibold text-stone">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const key = getKey(option);
          const checked = isChecked(key);
          const disabled = disabledOption(option);
          return (
            <label
              key={key}
              className={`flex items-center gap-2 rounded-full border py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass/40 ${
                disabled
                  ? "cursor-not-allowed border-stone/15 bg-white text-stone/45"
                  : checked
                    ? "cursor-pointer border-brass bg-brass/15 font-medium text-brass-deep"
                    : `cursor-pointer bg-white text-ink hover:border-stone/40 ${error ? "border-rust" : "border-stone/25"}`
              } ${typeof renderOption(option) === "string" ? "px-3.5" : "pr-3.5 pl-1"}`}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={key}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(key)}
                className="sr-only"
              />
              {renderOption(option)}
            </label>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-stone">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-rust">{error}</p>}
    </fieldset>
  );
}
