import { useLocation } from "react-router-dom";
import { Hammer } from "lucide-react";
import useAuth from "../hooks/useAuth";
import roleMenus from "../routes/roleMenus";

// Trang tạm cho các mục menu chưa làm — tự lấy tiêu đề theo URL hiện tại.
// Thay bằng trang thật trong pages/<role>/ khi làm xong.
export default function PlaceholderPage({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const currentItem = (roleMenus[user.roleId] || []).find((item) =>
    pathname.startsWith(item.path)
  );

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {currentItem?.label ?? "Trang không tồn tại"}
      </h1>
      {/* Cùng kiểu trạng thái rỗng của các trang danh sách: hairline trên/dưới, chữ xám giữa khung */}
      <div className="mt-8 border-y border-stone/20 py-16 text-center text-stone">
        <Hammer className="mx-auto mb-3 h-10 w-10 text-stone/40" aria-hidden="true" />
        Chức năng đang được xây dựng.
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  );
}
