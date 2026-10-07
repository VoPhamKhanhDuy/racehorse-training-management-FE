import { Link } from "react-router-dom";
import heroTrainerHorse from "../assets/images/heroTrainerHorse.jpg";

// Khung chung cho các trang Đăng nhập / Đăng ký: ảnh bên trái, form bên phải
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-white text-[#232328]">
      {/* Cột ảnh — ẩn trên mobile */}
      <aside className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src={heroTrainerHorse}
          alt="Huấn luyện viên đứng cạnh ngựa đua"
          className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#232328]/90 via-[#232328]/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#232328]/60 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            Equi<span className="text-[#F2A71B]">Track</span>
          </Link>
          <div>
            <p className="text-3xl font-bold leading-snug">
              Mỗi buổi tập được ghi lại,
              <br />
              <span className="text-[#F2A71B]">mỗi chiến mã được chăm sóc.</span>
            </p>
            <p className="mt-3 max-w-md text-white/80">
              Hệ thống quản lý huấn luyện ngựa đua dành cho HLV, bác sĩ thú y, nhân viên
              chuồng trại và chủ ngựa.
            </p>
          </div>
        </div>
      </aside>

      {/* Cột form */}
      <main className="flex w-full flex-col px-4 py-8 sm:px-8 lg:w-1/2">
        <Link to="/" className="text-2xl font-bold tracking-tight lg:hidden">
          Equi<span className="text-[#F2A71B]">Track</span>
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-[#6E6E76]">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-[#6E6E76]">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
