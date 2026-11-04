// Chọn Giới tính trong form hồ sơ ngựa: chip chọn-một (radio), không dùng dropdown.
// Dùng input radio thật (ẩn) để bàn phím mũi tên + trình đọc màn hình chạy sẵn.
// labels (tùy chọn): { giá trị: nhãn hiển thị } — chỉ đổi chữ trên chip, giá trị gửi đi vẫn là giá trị gốc.
export default function GenderChips({ value, options, labels, error, onChange }) {
  return (
    <fieldset aria-invalid={Boolean(error)}>
      <legend className="mb-1 block font-serif text-sm font-semibold text-stone">Giới tính</legend>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((option) => {
          const checked = value === option;
          return (
            <label
              key={option}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass/40 ${
                checked
                  ? "border-brass bg-brass/15 font-medium text-brass-deep"
                  : `bg-white text-ink hover:border-stone/40 ${error ? "border-rust" : "border-stone/25"}`
              }`}
            >
              <input
                type="radio"
                name="GioiTinh"
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {labels?.[option] ?? option}
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-sm text-rust">{error}</p>}
    </fieldset>
  );
}
