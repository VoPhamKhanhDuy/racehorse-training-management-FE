// Nhóm ô chọn (vuông bo 4px, không pill) cho form Ghi lần khám, dùng input thật (ẩn) để bàn phím + trình đọc màn hình chạy sẵn.
// multiple = false: chọn một (radio), value là chuỗi; multiple = true: chọn nhiều (checkbox), value là mảng.
// renderOption(option): nội dung ô (mặc định là chính chuỗi option). disabledOption(option): khóa ô.
// firstOptionOwnRow: ô đầu tiên nằm riêng một hàng. selectedTextClass(option): màu chữ riêng khi ô đang được chọn.
export default function ChoiceBoxes({
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
  selectedTextClass = () => "",
  firstOptionOwnRow = false,
  hint,
}) {
  const isChecked = (key) => (multiple ? value.includes(key) : value === key);

  const renderBox = (option) => {
    const key = getKey(option);
    const checked = isChecked(key);
    const disabled = disabledOption(option);
    return (
      <label
        key={key}
        className={`flex h-10 items-center gap-2 rounded-[4px] border px-3.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#c2570c] ${
          disabled
            ? "cursor-not-allowed border-[#d9cfba] bg-white text-[#2b2118]/45"
            : checked
              ? `cursor-pointer border-[#c2570c] bg-[#fbf3e6] font-semibold ${selectedTextClass(option) || "text-[#2b2118]"}`
              : `cursor-pointer bg-white text-[#2b2118] hover:bg-[#f0efec] ${error ? "border-[#c0262d]" : "border-[#cfc4ad]"}`
        }`}
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
  };

  const [first, ...rest] = options;

  return (
    <fieldset aria-invalid={Boolean(error)}>
      <legend className="mb-1.5 block text-[13px] font-semibold text-[#4a3f33]">{legend}</legend>
      {firstOptionOwnRow ? (
        <div className="space-y-2">
          <div className="flex">{first !== undefined && renderBox(first)}</div>
          <div className="flex flex-wrap gap-2">{rest.map(renderBox)}</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">{options.map(renderBox)}</div>
      )}
      {hint && <p className="mt-1.5 text-[13px] text-[#6b6055]">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-[#c0262d]">{error}</p>}
    </fieldset>
  );
}
