// Bảng hairline nền trắng, header và dòng dùng chung 1 grid (template = giá trị grid-template-columns).
// columns: [{ key, label }]; children = các <DataRow>; footer: dòng chú thích dưới bảng.
export function DataTable({ columns, template, minWidth = 1000, footer, children }) {
  return (
    <div className="overflow-x-auto bg-white">
      <div role="table" style={{ minWidth }}>
        <div
          role="row"
          className="grid items-center gap-x-4 border-b border-[#2b2118]/25 px-4 py-3 text-xs font-medium tracking-wide text-[#6b6055] uppercase"
          style={{ gridTemplateColumns: template }}
        >
          {columns.map((column) => (
            <div key={column.key} role="columnheader" className="truncate">
              {column.label}
            </div>
          ))}
        </div>
        {children}
      </div>
      {footer && <p className="border-t border-[#ece5d6] px-4 py-2.5 text-xs text-[#6b6055]">{footer}</p>}
    </div>
  );
}

// Dòng dữ liệu cao 64px, canh giữa dọc; có onClick thì hiện con trỏ tay.
export function DataRow({ template, onClick, children }) {
  return (
    <div
      role="row"
      onClick={onClick}
      className={`grid h-16 items-center gap-x-4 border-b border-[#ece5d6] px-4 text-sm transition-colors hover:bg-[#faf6ee] ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{ gridTemplateColumns: template }}
    >
      {children}
    </div>
  );
}

export function DataCell({ children, className = "", title }) {
  return (
    <div role="cell" title={title} className={`min-w-0 ${className}`}>
      {children}
    </div>
  );
}
