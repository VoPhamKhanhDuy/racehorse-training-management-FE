import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

// Báo lỗi khi gọi API thật thất bại (ApiError: message + details, vd lý do thể trạng của lỗi 422 HORSE_NOT_FIT).
// variant "inline": khung đỏ nhạt trong form / ngăn chi tiết. variant "page": thay cả nội dung trang, có nút Thử lại.
// Chưa có phiên BE (đăng nhập bằng tài khoản mock) hoặc phiên hết hạn → nút Đăng nhập lại.
export default function ApiErrorNotice({ error, variant = "inline", onRetry }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  if (!error) return null;

  const message = error.message || "Đã có lỗi xảy ra, vui lòng thử lại.";
  const details = Array.isArray(error.details) ? error.details : [];
  const needLogin = error.code === "NO_API_SESSION" || error.status === 401;

  const handleLogin = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (variant === "page") {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/30 px-6 py-14 text-center">
        <p className="font-serif text-xl font-semibold text-ink">
          {needLogin ? "Cần đăng nhập tài khoản máy chủ" : "Không tải được dữ liệu"}
        </p>
        <p className="mt-2 text-sm text-stone">{message}</p>
        {details.length > 0 && (
          <ul className="mx-auto mt-3 max-w-md list-disc space-y-1 pl-5 text-left text-sm text-stone">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex justify-center gap-5">
          {needLogin ? (
            <button type="button" onClick={handleLogin} className="btn-primary">
              Đăng nhập lại
            </button>
          ) : (
            onRetry && (
              <button type="button" onClick={onRetry} className="btn-primary">
                Thử lại
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div role="alert" className="rounded-sm border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert">
      <p>{message}</p>
      {details.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
      {needLogin && (
        <button type="button" onClick={handleLogin} className="mt-2 cursor-pointer font-semibold underline-offset-2 hover:underline">
          Đăng nhập lại
        </button>
      )}
    </div>
  );
}
