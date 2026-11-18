import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import useAuth from "../../hooks/useAuth";
import roleHomePaths from "../../routes/roleHomePaths";
import { DEFAULT_STAFF_PASSWORD } from "../../services/accountService";
import { isValidPassword, MIN_PASSWORD_LENGTH } from "../../utils/validators";

const initialForm = { newPassword: "", confirmPassword: "" };

// Đổi mật khẩu lần đầu — bắt buộc với tài khoản có mustChangePassword (nhân sự mới dùng mật khẩu mặc định).
// ProtectedRoute chặn mọi trang khác cho tới khi đổi xong; không có nút bỏ qua, chỉ có thể đăng xuất.
export default function ChangePassword() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  // Đổi xong (hoặc không cần đổi) thì không ở lại trang này
  if (!user.mustChangePassword) return <Navigate to={roleHomePaths[user.roleId] || "/"} replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!isValidPassword(form.newPassword))
      newErrors.newPassword = `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`;
    else if (form.newPassword === DEFAULT_STAFF_PASSWORD)
      newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu mặc định";
    if (!form.confirmPassword) newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu";
    else if (form.confirmPassword !== form.newPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      const updated = await changePassword(form.newPassword);
      navigate(roleHomePaths[updated.roleId] || "/", { replace: true });
    } catch {
      setErrors({ form: "Không đổi được mật khẩu, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout
      title="Đổi mật khẩu lần đầu"
      subtitle={`Xin chào ${user.fullName}. Tài khoản của bạn đang dùng mật khẩu mặc định — vui lòng đặt mật khẩu mới trước khi tiếp tục.`}
      footer={
        <>
          Không phải bạn?{" "}
          <button type="button" onClick={handleLogout} className="cursor-pointer font-semibold text-[#C65D18] hover:underline">
            Đăng xuất
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Mật khẩu mới"
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
          autoComplete="new-password"
          value={form.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
        />
        <FormField
          label="Xác nhận mật khẩu mới"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-xl bg-orange-500 py-3 font-semibold text-white shadow-md transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang lưu..." : "Đổi mật khẩu và tiếp tục"}
          </button>
          {errors.form && <p className="mt-2 text-sm text-red-500">{errors.form}</p>}
        </div>
      </form>
    </AuthLayout>
  );
}
