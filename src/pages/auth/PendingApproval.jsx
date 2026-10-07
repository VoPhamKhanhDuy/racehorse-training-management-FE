import { Link, useLocation } from "react-router-dom";

export default function PendingApproval() {
  const { state } = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-4 text-[#232328]">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F2A71B]/15 text-[#C65D18]">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold">Đăng ký thành công!</h1>
        <p className="mt-3 text-[#6E6E76]">
          {state?.fullName ? `Cảm ơn ${state.fullName}. ` : ""}
          Tài khoản của bạn đang chờ <span className="font-semibold text-[#232328]">Quản lý CLB</span>{" "}
          phê duyệt.
          {state?.email && (
            <>
              {" "}Chúng tôi sẽ gửi thông báo tới{" "}
              <span className="font-semibold text-[#232328]">{state.email}</span> khi hoàn tất.
            </>
          )}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="flex-1 rounded-lg border border-[#F2A71B] py-3 font-semibold text-[#C65D18] transition hover:bg-[#F2A71B]/10"
          >
            Về trang chủ
          </Link>
          <Link
            to="/login"
            className="flex-1 rounded-lg bg-[#F2A71B] py-3 font-semibold text-[#232328] transition hover:bg-[#e0961a]"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
