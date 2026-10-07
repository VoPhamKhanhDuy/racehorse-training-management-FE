import { useLocation } from "react-router-dom";
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
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <h1 className="text-2xl font-bold">{currentItem?.label ?? "Trang không tồn tại"}</h1>
      <p className="mt-2 text-[#6E6E76]">Chức năng đang được xây dựng.</p>
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
