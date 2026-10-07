import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import useAuth from "../../hooks/useAuth";
import users from "../../data/users";
import roleHomePaths from "../../routes/roleHomePaths";
import { isValidEmail } from "../../utils/validators";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Trang bị ProtectedRoute chặn trước đó (nếu có)
  const blockedPath = location.state?.from?.pathname;
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!isValidEmail(form.email)) newErrors.email = "Email không hợp lệ";
    if (!form.password) newErrors.password = "Vui lòng nhập mật khẩu";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!login(form.email, form.password)) {
      setErrors({ form: "Email hoặc mật khẩu không đúng" });
      return;
    }
    // Quay lại trang bị chặn nếu có, không thì về trang chủ của role
    const { roleId } = users.find(
      (u) => u.email.toLowerCase() === form.email.trim().toLowerCase()
    );
    navigate(blockedPath || roleHomePaths[roleId] || "/", { replace: true });
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục quản lý chuồng ngựa của bạn."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-[#C65D18] hover:underline">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Email"
          id="email"
          name="email"
          type="email"
          placeholder="Địa chỉ email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <div>
          <FormField
            label="Mật khẩu"
            id="password"
            name="password"
            type="password"
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <div className="mt-2 text-right">
            {/* TODO: trang quên mật khẩu */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-sm font-medium text-[#C65D18] hover:underline"
            >
              Quên mật khẩu?
            </a>
          </div>
        </div>
        <div>
          <button
            type="submit"
            className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white shadow-md cursor-pointer transition-colors hover:bg-orange-600"
          >
            Đăng nhập
          </button>
          {errors.form && <p className="mt-2 text-sm text-red-500">{errors.form}</p>}
        </div>
      </form>
    </AuthLayout>
  );
}
