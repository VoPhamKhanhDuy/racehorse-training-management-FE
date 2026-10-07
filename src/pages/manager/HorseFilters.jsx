import { ChevronDown, Search } from "lucide-react";

const SORT_OPTIONS = [
  { key: "Ten", label: "Tên A-Z" },
  { key: "Tuoi", label: "Tuổi tăng dần" },
  { key: "CanNang", label: "Cân nặng tăng dần" },
];

// Dropdown giữ <select> gốc (bàn phím, trình đọc màn hình chạy sẵn), chỉ đổi kiểu thành pill.
// Đang lọc (có giá trị) thì pill viền cam để dễ nhận ra.
function PillSelect({ id, label, value, onChange, children }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className={`cursor-pointer appearance-none rounded-full border py-2 pr-9 pl-4 text-sm text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brass/40 ${
          value ? "border-brass bg-brass/10" : "border-stone/25 bg-white hover:border-stone/40"
        }`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-stone" />
    </div>
  );
}

// Bộ lọc dạng pill: tìm tên + giống + chủ sở hữu (kết hợp AND), và hàng chọn cách sắp xếp
export default function HorseFilters({ filters, breeds, owners, sortKey, onChange, onSortChange }) {
  const handleChange = (e) => {
    onChange({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <label htmlFor="keyword" className="sr-only">
            Tìm theo tên ngựa
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" />
          <input
            id="keyword"
            name="keyword"
            type="search"
            placeholder="Tìm theo tên ngựa"
            value={filters.keyword}
            onChange={handleChange}
            className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
          />
        </div>
        <PillSelect id="breed" label="Lọc theo giống" value={filters.breed} onChange={handleChange}>
          <option value="">Tất cả giống</option>
          {breeds.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </PillSelect>
        <PillSelect id="ownerId" label="Lọc theo chủ sở hữu" value={filters.ownerId} onChange={handleChange}>
          <option value="">Tất cả chủ sở hữu</option>
          {owners.map((owner) => (
            <option key={owner.UserID} value={owner.UserID}>
              {owner.HoTen}
            </option>
          ))}
        </PillSelect>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-stone">Sắp xếp theo</span>
        {SORT_OPTIONS.map((option) => {
          const active = sortKey === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSortChange(option.key)}
              aria-pressed={active}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                active
                  ? "border-brass bg-brass/15 font-medium text-brass-deep"
                  : "border-stone/25 bg-white text-ink hover:border-stone/40"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
