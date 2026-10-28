// Hàng tab chữ gạch chân kèm số lượng. tabs: [{ value, label, count }]
export default function IncidentFilterTabs({ tabs, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-x-6" role="tablist" aria-label={label}>
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm transition-colors ${
              active
                ? "border-[#c2570c] font-semibold text-[#2b2118]"
                : "border-transparent text-[#4a3f33] hover:text-[#2b2118]"
            }`}
          >
            {t.label} <span className="tabular-nums">({t.count})</span>
          </button>
        );
      })}
    </div>
  );
}
