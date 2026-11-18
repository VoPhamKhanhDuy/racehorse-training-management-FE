import { Link } from "react-router-dom";
import heroTrainerHorse from "../assets/images/heroTrainerHorse.jpg";
import useAuth from "../hooks/useAuth";
import { CLUB_INFO } from "../config/clubInfo";

const highlights = [
  "Lập giáo án và lịch tập cho từng chiến mã",
  "Theo dõi sức khỏe, chấn thương và điều trị",
  "Kết nối HLV, bác sĩ thú y, nhân viên và chủ ngựa",
];

const features = [
  {
    title: "Giáo án huấn luyện",
    description: "Lập lịch tập, theo dõi tiến độ và phong độ từng buổi.",
  },
  {
    title: "Hồ sơ y tế",
    description: "Ghi nhận khám bệnh, cảnh báo chấn thương kịp thời.",
  },
  {
    title: "Quản lý chuồng trại",
    description: "Khẩu phần ăn, vật tư và công việc hằng ngày rõ ràng.",
  },
];

export default function Welcome() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white text-[#232328]">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            Equi<span className="text-[#F2A71B]">Track</span>
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-[#6E6E76] sm:inline">
                Xin chào, <span className="font-semibold text-[#232328]">{user.fullName}</span>
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold transition hover:bg-gray-50 sm:px-4"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="rounded-lg border border-[#F2A71B] px-3 py-2 text-sm font-semibold text-[#C65D18] transition hover:bg-[#F2A71B]/10 sm:px-4"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-[#F2A71B] px-3 py-2 text-sm font-semibold text-[#232328] transition hover:bg-[#e0961a] sm:px-4"
              >
                Đăng ký
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="grid items-start gap-10 pt-8 pb-12 md:grid-cols-2 md:pt-12 md:pb-16">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Quản lý huấn luyện
              <br />
              <span className="text-[#C65D18]">ngựa đua thông minh</span>
            </h1>
            <ul className="mt-8 space-y-4 text-lg text-[#6E6E76]">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[#F2A71B]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-[#F2A71B] px-6 py-3 font-semibold text-[#232328] shadow-sm transition hover:bg-[#e0961a]"
              >
                Bắt đầu ngay
              </Link>
            </div>
          </div>

          <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-lg">
            <img
              src={heroTrainerHorse}
              alt="Huấn luyện viên đứng cạnh ngựa đua"
              className="h-full w-full object-cover object-[center_30%]"
            />
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-6 pb-20 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-100 p-6 shadow-sm transition hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2A71B] font-bold text-[#232328]">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
              <p className="mt-1 text-[#6E6E76]">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Chân trang: nền #F5F5F5, cùng container (max-w-6xl) với nội dung phía trên; liên hệ đọc từ config/clubInfo.js, dòng rỗng thì bỏ */}
      <footer className="border-t border-[#E3E3E3] bg-[#F5F5F5] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-serif text-2xl font-semibold tracking-tight text-[#1f1f1f]">
                Equi<span className="text-[#c2570c]">Track</span>
              </p>
              <p className="mt-1 text-sm text-[#6b6b6b]">Hệ thống quản lý huấn luyện ngựa đua.</p>
            </div>
            <dl className="grid gap-x-8 gap-y-5 text-sm sm:grid-cols-3 md:col-span-2">
              {CLUB_INFO.phone && (
                <div>
                  <dt className="text-xs text-[#6b6b6b]">Điện thoại</dt>
                  <dd className="mt-1">
                    <a href={`tel:${CLUB_INFO.phone}`} className="text-[#c2570c] hover:underline">
                      {CLUB_INFO.phoneDisplay || CLUB_INFO.phone}
                    </a>
                  </dd>
                </div>
              )}
              {CLUB_INFO.email && (
                <div className="min-w-0">
                  <dt className="text-xs text-[#6b6b6b]">Email</dt>
                  <dd className="mt-1 break-words">
                    <a href={`mailto:${CLUB_INFO.email}`} className="text-[#c2570c] hover:underline">
                      {CLUB_INFO.email}
                    </a>
                  </dd>
                </div>
              )}
              {CLUB_INFO.address && (
                <div>
                  <dt className="text-xs text-[#6b6b6b]">Địa chỉ</dt>
                  <dd className="mt-1 line-clamp-2 text-[#1f1f1f]" title={CLUB_INFO.address}>
                    {CLUB_INFO.address}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </footer>
    </div>
  );
}
