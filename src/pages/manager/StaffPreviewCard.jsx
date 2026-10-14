import { DEFAULT_STAFF_PASSWORD } from "../../services/accountService";

// Khối xem trước tài khoản nhân sự, cập nhật theo form tạo/sửa ở CreateStaffAccount.
// Viền hairline, bo nhẹ, không shadow — cùng tinh thần bảng ở /manager/staff.
export default function StaffPreviewCard({ fullName, email, roleName, isEdit }) {
  const name = fullName.trim();
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <section aria-label="Xem trước tài khoản" className="rounded-sm border border-stone/20 bg-white">
      <p className="border-b border-stone/15 px-5 py-2.5 text-xs font-medium tracking-wide text-stone uppercase">
        Xem trước tài khoản
      </p>

      <div className="flex flex-col items-center px-5 pt-6 pb-5 text-center">
        {/* Cùng kiểu avatar ở Header, phóng to */}
        <span
          aria-hidden="true"
          className={`flex h-16 w-16 items-center justify-center rounded-full font-serif text-2xl font-semibold ${
            name ? "bg-brass/20 text-brass-deep" : "bg-stone/10 text-stone/60"
          }`}
        >
          {initial}
        </span>
        <p className={`mt-3 max-w-full truncate font-serif text-lg leading-snug font-semibold ${name ? "text-ink" : "text-stone/50"}`}>
          {name || "Chưa nhập họ tên"}
        </p>
        <p className={`mt-0.5 max-w-full truncate text-sm ${email.trim() ? "text-stone" : "text-stone/50"}`}>
          {email.trim() || "Chưa nhập email"}
        </p>
        {/* Badge vai trò: cùng màu pill lọc đang chọn */}
        <span
          className={`mt-3 rounded-full px-3 py-1 text-xs font-medium ${
            roleName ? "bg-brass/15 text-brass-deep" : "border border-dashed border-stone/30 text-stone/60"
          }`}
        >
          {roleName || "Chưa chọn vai trò"}
        </span>
      </div>

      {/* Thông tin đăng nhập ban đầu — chỉ khi tạo mới */}
      {!isEdit && (
        <dl className="space-y-1.5 border-t border-stone/15 px-5 py-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-stone">Mật khẩu ban đầu</dt>
            <dd className="font-semibold text-ink">{DEFAULT_STAFF_PASSWORD}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone">Lần đăng nhập đầu</dt>
            <dd className="text-ink">Bắt buộc đổi mật khẩu</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
