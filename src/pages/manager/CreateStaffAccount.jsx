import { useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../../components/FormField";
import useAuth from "../../hooks/useAuth";
import users from "../../data/users";
import roles from "../../data/roles";
import { isValidEmail } from "../../utils/validators";

// Các vai trò nhân sự nội bộ do Quản lý CLB tạo tài khoản
const STAFF_ROLE_IDS = ["head_trainer", "veterinarian", "groom"];
const staffRoles = roles.filter((role) => STAFF_ROLE_IDS.includes(role.id));

const initialForm = { fullName: "", email: "", roleId: "" };

export default function CreateStaffAccount() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [createdAccount, setCreatedAccount] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên";
    if (!form.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!isValidEmail(form.email)) newErrors.email = "Email không hợp lệ";
    else if (users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase()))
      newErrors.email = "Email này đã có tài khoản";
    if (!form.roleId) newErrors.roleId = "Vui lòng chọn vai trò";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setCreatedAccount(null);
      return;
    }
    // TODO: gọi API tạo tài khoản thật khi BE xong
    const newAccount = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      roleId: form.roleId,
    };
    setCreatedAccount(newAccount);
    setForm(initialForm);
  };

  const createdRoleName = createdAccount
    ? roles.find((role) => role.id === createdAccount.roleId)?.name
    : "";

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#232328]">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            Equi<span className="text-[#F2A71B]">Track</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[#6E6E76] sm:inline">
              Quản lý CLB · <span className="font-semibold text-[#232328]">{user.fullName}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold transition hover:bg-gray-50 sm:px-4"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">Tạo tài khoản nhân sự</h1>
        <p className="mt-2 text-[#6E6E76]">
          Cấp tài khoản cho HLV trưởng, bác sĩ thú y và nhân viên chăm sóc của câu lạc bộ.
        </p>

        {createdAccount && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Đã tạo tài khoản <span className="font-semibold">{createdRoleName}</span> cho{" "}
            <span className="font-semibold">{createdAccount.fullName}</span> ({createdAccount.email}).
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <FormField
            label="Họ và tên"
            id="fullName"
            name="fullName"
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />
          <FormField
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="nhanvien@racehorse.vn"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <fieldset>
            <legend className="mb-1.5 block text-sm font-semibold">Vai trò</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {staffRoles.map((role) => {
                const selected = form.roleId === role.id;
                return (
                  <label
                    key={role.id}
                    className={`cursor-pointer rounded-lg border px-3 py-2.5 transition ${
                      selected
                        ? "border-[#F2A71B] bg-[#F2A71B]/10 ring-2 ring-[#F2A71B]/20"
                        : "border-gray-200 hover:border-[#F2A71B]/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleId"
                      value={role.id}
                      checked={selected}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="block text-sm font-semibold">{role.name}</span>
                    <span className="block text-xs text-[#6E6E76]">{role.description}</span>
                  </label>
                );
              })}
            </div>
            {errors.roleId && <p className="mt-1.5 text-sm text-red-500">{errors.roleId}</p>}
          </fieldset>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#F2A71B] py-3 font-semibold text-[#232328] shadow-sm transition hover:bg-[#e0961a]"
          >
            Tạo tài khoản
          </button>
        </form>
      </main>
    </div>
  );
}
