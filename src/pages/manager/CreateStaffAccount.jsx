import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BookOpen, Brush, Cross } from "lucide-react";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import StaffPreviewCard from "./StaffPreviewCard";
import roles, { STAFF_ROLE_IDS } from "../../data/roles";
import {
  createStaffAccount,
  DEFAULT_STAFF_PASSWORD,
  getUserById,
  isEmailTaken,
  updateStaffAccount,
} from "../../services/accountService";
import { isValidEmail } from "../../utils/validators";

const staffRoles = roles.filter((role) => STAFF_ROLE_IDS.includes(role.id));

// Icon line-art cho từng vai trò (lucide-react)
const ROLE_ICONS = {
  head_trainer: BookOpen, // giáo án huấn luyện
  veterinarian: Cross, // chữ thập y tế
  groom: Brush, // chải lông, vệ sinh chuồng
};

const emptyForm = { fullName: "", email: "", roleId: "" };

// Dùng chung cho /manager/staff/new (tạo) và /manager/staff/:id/edit (sửa)
export default function CreateStaffAccount() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock accountService)
  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;
    getUserById(id).then((user) => {
      if (ignore) return;
      // Chỉ sửa được tài khoản nhân sự nội bộ, không sửa Chủ ngựa/Quản lý CLB ở đây
      if (user && STAFF_ROLE_IDS.includes(user.roleId)) {
        setForm({ fullName: user.fullName, email: user.email, roleId: user.roleId });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

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
    else if (isEmailTaken(form.email, id)) newErrors.email = "Email này đã có tài khoản";
    if (!form.roleId) newErrors.roleId = "Vui lòng chọn vai trò";
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
      const saved = isEdit ? await updateStaffAccount(id, form) : await createStaffAccount(form);
      navigate("/manager/staff", {
        state: {
          message: isEdit
            ? `Đã cập nhật tài khoản của "${saved.fullName}".`
            : `Đã tạo tài khoản cho "${saved.fullName}" (${saved.email}).`,
        },
      });
    } catch {
      setErrors({ form: "Không lưu được tài khoản, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Không tìm thấy nhân sự</h1>
        <p className="mt-2 text-stone">Tài khoản này không tồn tại hoặc không phải tài khoản nhân sự.</p>
        <Link to="/manager/staff" className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const selectedRole = staffRoles.find((role) => role.id === form.roleId);

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/manager/staff" className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại danh sách
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isEdit ? "Sửa tài khoản nhân sự" : "Tạo tài khoản nhân sự"}
      </h1>
      <p className="mt-2 text-stone">
        {isEdit
          ? "Cập nhật họ tên, email hoặc vai trò của nhân sự."
          : "Cấp tài khoản cho HLV trưởng, bác sĩ thú y và nhân viên chăm sóc của câu lạc bộ."}
      </p>

      {/* 2 cột lệch: form ~65% bên trái, xem trước ~35% bên phải (dính khi cuộn). Dưới md xem trước xuống dưới form. */}
      <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:gap-10">
        <form onSubmit={handleSubmit} noValidate>
          {errors.form && (
            <p className="mb-5 rounded-sm border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert">{errors.form}</p>
          )}

          {/* Chia mục bằng hairline + số thứ tự kiểu sổ ghi chép, thay cho card bo tròn có shadow */}
          <FormSection number="01" title="Thông tin nhân sự">
            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <FormField
                variant="outline"
                label="Họ và tên"
                id="fullName"
                name="fullName"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange}
                error={errors.fullName}
              />
              <FormField
                variant="outline"
                label="Email"
                id="email"
                name="email"
                type="email"
                placeholder="ten@equitrack.vn"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
              />
            </div>
          </FormSection>

          <FormSection number="02" title="Vai trò">
            <fieldset>
              <legend className="sr-only">Vai trò</legend>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {staffRoles.map((role) => {
                  const selected = form.roleId === role.id;
                  const RoleIcon = ROLE_ICONS[role.id];
                  return (
                    // Đang chọn: viền cam đậm (thêm ring 1px, không xô bố cục) + nền cam rất nhạt + tiêu đề đậm/màu cam
                    <label
                      key={role.id}
                      className={`cursor-pointer rounded-sm border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass/40 ${
                        selected ? "border-brass bg-brass/10 ring-1 ring-brass" : "border-stone/25 bg-white hover:border-stone/45"
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
                      <RoleIcon
                        className={`h-5 w-5 ${selected ? "text-brass-deep" : "text-stone"}`}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <span
                        className={`mt-2 block text-sm ${selected ? "font-semibold text-brass-deep" : "font-medium text-ink"}`}
                      >
                        {role.name}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-stone">{role.description}</span>
                    </label>
                  );
                })}
              </div>
              {errors.roleId && <p className="mt-1.5 text-sm text-alert">{errors.roleId}</p>}
            </fieldset>
          </FormSection>

          <div className="border-t border-stone/20 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full cursor-pointer rounded-sm bg-brass py-3 font-semibold text-ink transition-colors hover:bg-brass/85 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
            </button>
            {/* Chỉ khi tạo mới: mật khẩu mặc định do accountService gán, nhân sự bị bắt đổi ở lần đăng nhập đầu */}
            {!isEdit && (
              <p className="mt-3 text-center text-sm text-stone">
                Mật khẩu mặc định: <span className="font-semibold text-ink">{DEFAULT_STAFF_PASSWORD}</span> — nhân sự sẽ
                được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
              </p>
            )}
          </div>
        </form>

        {/* top-24: chừa chỗ cho Header dính (h-16) */}
        <aside className="md:sticky md:top-24">
          <StaffPreviewCard
            fullName={form.fullName}
            email={form.email}
            roleName={selectedRole?.name}
            isEdit={isEdit}
          />
        </aside>
      </div>
    </div>
  );
}

// 1 mục của form: số thứ tự + tiêu đề serif, ngăn với mục trước bằng hairline
function FormSection({ number, title, children }) {
  return (
    <section className="border-t border-stone/20 pt-5 pb-7">
      <h2 className="mb-4 flex items-baseline gap-2.5 font-serif text-base font-semibold text-ink">
        <span className="text-sm text-brass-deep">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
