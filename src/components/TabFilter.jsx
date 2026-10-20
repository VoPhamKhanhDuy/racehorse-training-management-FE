// Bộ lọc dạng tab chữ: tab đang chọn đậm + gạch chân cam, tab khác chữ xám.
// options: [{ code, label }]; value = code đang chọn; onChange(code)
export default function TabFilter({ options, value, onChange, ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-x-6 border-b border-[#ece5d6]">
      {options.map((option) => {
        const active = value === option.code;
        return (
          <button
            key={option.code || "all"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.code)}
            className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm transition-colors ${
              active
                ? "border-[#c2570c] font-semibold text-[#2b2118]"
                : "border-transparent text-[#6b6055] hover:font-medium hover:text-[#2b2118]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
