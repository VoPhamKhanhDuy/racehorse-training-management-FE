import { Link } from "react-router-dom";
import AccountStatusText from "../../components/AccountStatusText";

// Nội dung theo trạng thái + nguồn: vừa đăng ký xong (register) hay đăng nhập đúng mật khẩu nhưng chưa vào được (login)
function getContent(status, source) {
  if (status === "Từ chối") {
    return {
      title: "Đăng ký không được duyệt",
      description: "Quản lý CLB đã từ chối đăng ký này. Bạn có thể liên hệ Quản lý CLB hoặc đăng ký lại bằng email khác.",
    };
  }
  return source === "login"
    ? { title: "Tài khoản đang chờ duyệt", description: "Quản lý CLB chưa duyệt tài khoản của bạn. Vui lòng quay lại sau." }
    : {
        title: "Đã gửi đăng ký",
        description: "Tài khoản Chủ ngựa của bạn đang chờ Quản lý CLB duyệt. Sau khi được duyệt, bạn có thể đăng nhập.",
      };
}

// Màn trạng thái tài khoản dùng chung (sau Đăng ký, hoặc Đăng nhập khi tài khoản chờ duyệt / bị từ chối):
// trang đơn nền be, wordmark + 1 tờ phiếu căn giữa 2 chiều. status: "Chờ duyệt" | "Từ chối"; source: "register" | "login".
// onBack: "Quay lại đăng nhập" (trang cha xóa state tạm rồi về /login). Từ chối: thêm link "Đăng ký lại".
export default function AccountStatusCard({ status, source, fullName, email, onBack }) {
  const { title, description } = getContent(status, source);
  const rows = [
    { label: "Họ và tên", value: fullName },
    { label: "Email", value: email },
    { label: "Trạng thái", value: <AccountStatusText status={status} /> },
  ].filter((row) => row.value);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#f6f1e8] py-10 text-ink">
      {/* Wordmark cùng kiểu với Sidebar trong app */}
      <Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-ink">
        Equi<span className="text-brass">Track</span>
      </Link>

      <main className="mt-6 w-[440px] max-w-[calc(100%-32px)] rounded-[4px] border border-[#e4dccd] bg-[#fffdf9] p-6 sm:p-9">
        <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-stone">{description}</p>

        <dl className="mt-6 border-t border-[#ece5d8] text-[15px]">
          {rows.map((row) => (
            <div key={row.label} className="flex min-h-11 items-center justify-between gap-6 border-b border-[#ece5d8] py-2">
              <dt className="shrink-0 text-stone">{row.label}</dt>
              <dd className="min-w-0 text-right break-words text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex items-center justify-end gap-4">
          {status === "Từ chối" && (
            <Link to="/register" replace className="text-sm text-stone underline-offset-2 hover:text-ink hover:underline">
              Đăng ký lại
            </Link>
          )}
          <button type="button" onClick={onBack} className="btn-primary">
            Quay lại đăng nhập
          </button>
        </div>
      </main>
    </div>
  );
}
