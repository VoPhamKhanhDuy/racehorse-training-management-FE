import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

// Khung chung cho mọi trang sau đăng nhập: Sidebar trái + Header trên + nội dung route con
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  // Chuyển trang thì cuộn về đầu — SPA giữ nguyên vị trí cuộn của trang trước, làm tiêu đề trang mới
  // bị đẩy lên khuất sau Header dính (vd đang cuộn giữa /manager/staff rồi bấm sang Quản lý vật tư)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-parchment text-ink">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:px-8 lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
