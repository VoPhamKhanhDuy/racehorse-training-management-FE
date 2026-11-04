import { createContext, useContext } from "react";

// DataRow / DataCell đọc kiểu bảng từ DataTable bao ngoài (framed hay không)
const FramedContext = createContext(false);

// Bảng hairline nền trắng, header và dòng dùng chung 1 grid (template = giá trị grid-template-columns).
// columns: [{ key, label }]; children = các <DataRow>; footer: dòng chú thích dưới bảng.
// plainHeader: tiêu đề cột chữ thường, không giãn chữ.
// framed: bảng có khung (viền #b9ab90, bo 4px), tiêu đề nền nâu #4a3a2a cao 40px, kẻ hàng/cột #d9cfba, hover #f0efec,
// chân bảng nền trắng — cùng kiểu bảng ở trang danh sách giáo án.
export function DataTable({ columns, template, minWidth = 1000, footer, plainHeader = false, framed = false, children }) {
  if (framed) {
    return (
      <FramedContext.Provider value>
        <div className="overflow-x-auto rounded border border-[#b9ab90] bg-white">
          <div role="table" style={{ minWidth }}>
            <div
              role="row"
              className="grid min-h-10 bg-[#4a3a2a] text-[13px] font-semibold text-[#f3ede0]"
              style={{ gridTemplateColumns: template }}
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  role="columnheader"
                  className="flex min-w-0 items-center border-r border-[#6b5a45] px-3 py-2 last:border-r-0"
                >
                  {column.label}
                </div>
              ))}
            </div>
            {children}
            {footer && (
              <p className="flex h-10 items-center bg-white px-4 text-[13px] text-[#6b6055]">{footer}</p>
            )}
          </div>
        </div>
      </FramedContext.Provider>
    );
  }

  return (
    <div className="overflow-x-auto bg-white">
      <div role="table" style={{ minWidth }}>
        <div
          role="row"
          className={`grid items-center gap-x-4 border-b border-[#2b2118]/25 px-4 py-3 text-xs font-medium text-[#6b6055] ${
            plainHeader ? "" : "tracking-wide uppercase"
          }`}
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

// Dòng dữ liệu cao 64px, canh giữa dọc; có onClick thì hiện con trỏ tay. Trong bảng framed: cao tối thiểu 56px, kẻ hàng #d9cfba.
export function DataRow({ template, onClick, className = "", children }) {
  const framed = useContext(FramedContext);
  return (
    <div
      role="row"
      onClick={onClick}
      className={
        framed
          ? `grid min-h-14 border-b border-[#d9cfba] text-sm transition-colors last:border-b-0 hover:bg-[#f0efec] ${
              onClick ? "cursor-pointer" : ""
            } ${className}`
          : `grid h-16 items-center gap-x-4 border-b border-[#ece5d6] px-4 text-sm transition-colors hover:bg-[#faf6ee] ${
              onClick ? "cursor-pointer" : ""
            } ${className}`
      }
      style={{ gridTemplateColumns: template }}
    >
      {children}
    </div>
  );
}

// Trong bảng framed: ô cao đủ dòng (kẻ cột liền), nội dung canh giữa dọc
export function DataCell({ children, className = "", title }) {
  const framed = useContext(FramedContext);
  return (
    <div
      role="cell"
      title={title}
      className={`min-w-0 ${
        framed ? "flex flex-col justify-center border-r border-[#d9cfba] px-3 py-2 last:border-r-0" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
