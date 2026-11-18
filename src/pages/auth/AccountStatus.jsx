import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AccountStatusCard from "./AccountStatusCard";

const STATUSES = ["Chờ duyệt", "Từ chối"];
const SOURCES = ["register", "login"];

// Route /account-status: chỉ hiện khi vừa được chuyển sang từ Đăng ký hoặc Đăng nhập (route state
// { status, source, fullName, email }). Mở thẳng URL / mất state → về /login. Không tạo phiên đăng nhập.
export default function AccountStatus() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!STATUSES.includes(state?.status) || !SOURCES.includes(state?.source)) {
    return <Navigate to="/login" replace />;
  }

  // replace: thay mục lịch sử của màn này để Back không quay lại màn trạng thái với state cũ
  const backToLogin = () => navigate("/login", { replace: true, state: null });

  return (
    <AccountStatusCard
      status={state.status}
      source={state.source}
      fullName={state.fullName}
      email={state.email}
      onBack={backToLogin}
    />
  );
}
