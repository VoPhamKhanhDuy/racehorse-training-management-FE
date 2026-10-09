import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import { addUser, isEmailTaken } from "../../services/accountService";
import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from "../../utils/validators";

// Trang đăng ký công khai chỉ dành cho Chủ ngựa.
// Tài khoản nhân sự nội bộ do Quản lý CLB tạo ở pages/manager/CreateStaffAccount.jsx
const REGISTER_ROLE_ID = "horse_owner";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  // Đã rời khỏi ô "Xác nhận mật khẩu" ít nhất 1 lần → bắt đầu báo lỗi không khớp
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordMismatch =
    form.confirmPassword !== "" && form.confirmPassword !== form.password;
  const confirmPasswordError =
    confirmTouched && passwordMismatch ? "Mật khẩu xác nhận không khớp" : errors.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      ...(name === "password" && { confirmPassword: undefined }),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên";
    if (!form.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!isValidEmail(form.email)) newErrors.email = "Email không hợp lệ";
    else if (isEmailTaken(form.email)) newErrors.email = "Email này đã được đăng ký";
    if (!isValidPassword(form.password))
      newErrors.password = `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`;
    if (!form.confirmPassword) newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu";
    else if (form.confirmPassword !== form.password)
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // TODO: thay bằng gọi API thật khi BE xong
    // Chủ ngựa tự đăng ký phải chờ Quản lý CLB duyệt (/manager/approvals) mới đăng nhập được
    const newUser = addUser({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      roleId: REGISTER_ROLE_ID,
      status: "pending",
    });
    navigate("/pending-approval", { state: { fullName: newUser.fullName, email: newUser.email } });
  };

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Tài khoản Chủ ngựa, chờ Quản lý CLB duyệt trước khi dùng."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-[#C65D18] hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Họ và tên"
          id="fullName"
          name="fullName"
          placeholder="Họ và tên đầy đủ"
          autoComplete="name"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
        />
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Mật khẩu"
            id="password"
            name="password"
            type="password"
            placeholder={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <FormField
            label="Xác nhận mật khẩu"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={() => setConfirmTouched(true)}
            error={confirmPasswordError}
          />
        </div>

        <button
          type="submit"
          disabled={passwordMismatch}
          className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white shadow-md cursor-pointer transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-orange-500"
        >
          Đăng ký
        </button>
      </form>
    </AuthLayout>
  );
}
