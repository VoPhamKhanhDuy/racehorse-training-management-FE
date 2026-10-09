import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, Search, SearchX, UserCheck, Users } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import StaffRow from "./StaffRow";
import roles, { STAFF_ROLE_IDS } from "../../data/roles";
import { getUsers, setUserActive } from "../../services/accountService";

const roleNameById = Object.fromEntries(roles.map((role) => [role.id, role.name]));

// Nhãn pill rút gọn cho vừa hàng lọc; cột Vai trò trong bảng vẫn dùng tên đầy đủ từ data/roles
const ROLE_FILTERS = [
  { roleId: "", label: "Tất cả" },
  { roleId: "head_trainer", label: "HLV trưởng" },
  { roleId: "veterinarian", label: "Bác sĩ thú y" },
  { roleId: "groom", label: "Chăm sóc" },
];

export default function StaffManagement() {
  // Thông báo do form tạo/sửa nhân sự gửi sang sau khi lưu thành công
  const { state } = useLocation();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [staffToToggle, setStaffToToggle] = useState(null); // nhân sự đang chờ xác nhận khóa/mở khóa
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(state?.message ?? "");

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock accountService)
  useEffect(() => {
    let ignore = false;
    getUsers().then((userList) => {
      if (ignore) return;
      // Chỉ nhân sự nội bộ — không hiện Quản lý CLB và Chủ ngựa
      setStaffList(userList.filter((u) => STAFF_ROLE_IDS.includes(u.roleId)));
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Số liệu tổng quan — tính trên toàn bộ nhân sự, không phụ thuộc bộ lọc
  const activeCount = staffList.filter((s) => s.isActive).length;
  const stats = [
    { label: "Tổng nhân sự", value: staffList.length, icon: Users },
    { label: "Đang hoạt động", value: activeCount, icon: UserCheck },
    { label: "Đã khóa", value: staffList.length - activeCount, icon: Lock },
  ];

  // Tìm theo họ tên HOẶC email (không phân biệt hoa thường), kết hợp AND với lọc vai trò
  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleStaff = staffList
    .filter(
      (s) =>
        (!roleFilter || s.roleId === roleFilter) &&
        (s.fullName.toLowerCase().includes(normalizedKeyword) || s.email.toLowerCase().includes(normalizedKeyword))
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));

  const handleConfirmToggle = async () => {
    const staff = staffToToggle;
    setProcessing(true);
    const updated = await setUserActive(staff.id, !staff.isActive);
    setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setProcessing(false);
    setStaffToToggle(null);
    setMessage(
      updated.isActive
        ? `Đã mở khóa tài khoản của "${updated.fullName}".`
        : `Đã khóa tài khoản của "${updated.fullName}".`
    );
  };

  const locking = staffToToggle?.isActive;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Quản lý nhân sự</h1>
          <p className="mt-1 text-stone">Tài khoản HLV trưởng, bác sĩ thú y và nhân viên chăm sóc của câu lạc bộ.</p>
        </div>
        <Link
          to="/manager/staff/new"
          className="rounded-sm bg-brass px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brass/85"
        >
          + Tạo tài khoản nhân sự
        </Link>
      </div>

      {message && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-sm border-l-2 border-green-700 bg-white/60 px-4 py-3 text-sm text-green-800">
          {message}
          <button
            type="button"
            onClick={() => setMessage("")}
            className="cursor-pointer font-semibold text-green-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          {/* Dải số liệu trong 1 card trắng (viền hairline, bo nhẹ, bóng nhẹ) để tách khỏi nền trang; vạch dọc ngăn từng ô */}
          <div className="grid grid-cols-3 divide-x divide-stone/20 overflow-hidden rounded-lg border border-stone/15 bg-white shadow-sm">
            {stats.map((stat) => (
              <div key={stat.label} className="px-4 py-3 sm:px-5">
                <p className="text-xs font-medium text-stone sm:text-sm">{stat.label}</p>
                <p className="mt-0.5 flex items-center gap-2 font-serif text-[1.75rem] leading-tight font-semibold text-ink">
                  <stat.icon className="h-5 w-5 shrink-0 text-stone" aria-hidden="true" />
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {/* Ô tìm kiếm cùng kiểu ô tìm tên ngựa ở HorseFilters */}
            <div className="relative w-full sm:w-80">
              <label htmlFor="staffKeyword" className="sr-only">
                Tìm theo tên hoặc email
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" />
              <input
                id="staffKeyword"
                type="search"
                placeholder="Tìm theo tên hoặc email..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-full border border-stone/20 bg-white py-2 pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo vai trò">
              {ROLE_FILTERS.map((f) => {
                const active = roleFilter === f.roleId;
                return (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => setRoleFilter(f.roleId)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-brass bg-brass/15 font-medium text-brass-deep"
                        : "border-stone/25 bg-white text-ink hover:border-stone/40"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {visibleStaff.length === 0 ? (
            <div className="mt-10 border-y border-stone/20 py-16 text-center text-stone">
              {/* Có từ khóa → không khớp tìm kiếm; không có → vai trò đang lọc chưa có ai */}
              {normalizedKeyword ? (
                <>
                  <SearchX className="mx-auto mb-3 h-10 w-10 text-stone/40" />
                  Không tìm thấy nhân sự phù hợp
                </>
              ) : (
                <>
                  <Users className="mx-auto mb-3 h-10 w-10 text-stone/40" />
                  Không có nhân sự nào thuộc vai trò này.
                </>
              )}
            </div>
          ) : (
            // Bảng kỷ luật: header và dòng đều ngăn bằng hairline xám (không dùng màu nhấn cho viền), không zebra.
            // Không đặt độ rộng cứng: bớt cột theo độ rộng màn hình để vừa khung (đủ 6 cột từ 1360px; dưới xl ẩn Email,
            // dưới md ẩn Vai trò; dưới sm ẩn Trạng thái — hiện dưới tên; Ngày tạo chỉ hiện từ 1360px). overflow-x-auto chỉ là phương án dự phòng trên điện thoại.
            // mt-10 (40px) gộp với lề 20px của space-y-5 thành 40px: gấp đôi khoảng cách cũ, tách rõ bảng khỏi pill lọc
            <div className="mt-10 overflow-x-auto bg-white">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="whitespace-nowrap text-stone">
                  <tr>
                    <th className="border-b border-b-stone/20 px-4 py-3 font-medium">Họ tên</th>
                    <th className="hidden border-b border-b-stone/20 px-4 py-3 font-medium xl:table-cell">Email</th>
                    <th className="hidden border-b border-b-stone/20 px-4 py-3 font-medium md:table-cell">Vai trò</th>
                    <th className="hidden border-b border-b-stone/20 px-4 py-3 font-medium min-[1360px]:table-cell">Ngày tạo</th>
                    <th className="hidden border-b border-b-stone/20 px-4 py-3 font-medium sm:table-cell">Trạng thái</th>
                    <th className="sticky right-0 border-b border-b-stone/20 bg-white py-3 pr-4 pl-6 text-right font-medium">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStaff.map((staff) => (
                    <StaffRow
                      key={staff.id}
                      staff={staff}
                      roleName={roleNameById[staff.roleId]}
                      onToggleActive={setStaffToToggle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(staffToToggle)}
        title={locking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        message={
          locking
            ? `Khóa tài khoản của "${staffToToggle?.fullName ?? ""}"? Người này sẽ không thể đăng nhập cho tới khi được mở khóa.`
            : `Mở khóa tài khoản của "${staffToToggle?.fullName ?? ""}"? Người này sẽ đăng nhập lại được.`
        }
        confirmLabel={locking ? "Khóa" : "Mở khóa"}
        danger={locking}
        loading={processing}
        onConfirm={handleConfirmToggle}
        onCancel={() => setStaffToToggle(null)}
      />
    </div>
  );
}
