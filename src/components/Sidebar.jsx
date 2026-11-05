import { Link, NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import useAuth from "../hooks/useAuth";
import roleMenus from "../routes/roleMenus";
import roleHomePaths from "../routes/roleHomePaths";
import usePlanApprovalBadge from "../hooks/usePlanApprovalBadge";
import useRaceRegistrationBadge from "../hooks/useRaceRegistrationBadge";
import useSupplyRequestBadge from "../hooks/useSupplyRequestBadge";

// Mục menu hiện huy hiệu "Mới" khi có thông báo duyệt kế hoạch: Trainer → Giáo án tập luyện, Chủ ngựa → Lịch trình
const BADGE_PATHS = ["/trainer/plans", "/owner/schedule"];
// Đăng ký thi đấu đang chờ chính vai trò đó duyệt: Chủ ngựa → Thi đấu, Quản lý → Đăng ký thi đấu
const RACE_BADGE_PATHS = ["/owner/races", "/manager/race-registrations", "/trainer/race-registrations"];

// Menu bên trái, đổi theo role. isOpen/onClose chỉ dùng cho màn hình nhỏ (dạng ngăn kéo).
// collapsed/onToggleCollapse: thu gọn còn cột icon trên màn lớn (lg trở lên).
export default function Sidebar({ isOpen = false, onClose, collapsed = false, onToggleCollapse }) {
  const { user } = useAuth();
  const menuItems = roleMenus[user.roleId] || [];
  const newCount = usePlanApprovalBadge(user.roleId);
  const raceCount = useRaceRegistrationBadge(user.roleId);
  const supplyCount = useSupplyRequestBadge(user.roleId);
  const badgeCountOf = (path) =>
    BADGE_PATHS.includes(path) ? newCount : RACE_BADGE_PATHS.includes(path) ? raceCount : path === "/manager/supplies" ? supplyCount : 0;

  return (
    <>
      {/* Lớp nền mờ khi mở menu trên mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-[#232328]/40 lg:hidden" onClick={onClose} />
      )}

      {/* Màn nhỏ khi đóng: vừa trượt ra ngoài vừa invisible — không lộ chữ ra mép trái, không Tab vào được link ẩn */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col overflow-hidden border-r border-[#E6DDCF] bg-[#F5F0E8] transition-[translate,visibility] lg:visible lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-[width] ${
          collapsed ? "lg:w-16" : ""
        } ${
          isOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className={`flex h-16 items-center px-6 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link to={roleHomePaths[user.roleId] || "/"} className="font-serif text-2xl font-semibold tracking-tight text-ink">
            {collapsed ? (
              <>
                <span className="lg:hidden">
                  Equi<span className="text-[#c2570c]">Track</span>
                </span>
                <span className="hidden lg:inline" title="EquiTrack">
                  E<span className="text-[#c2570c]">T</span>
                </span>
              </>
            ) : (
              <>
                Equi<span className="text-[#c2570c]">Track</span>
              </>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                // Mục đang chọn: nền trắng bo nhẹ + chữ cam đậm; mục thường chữ nâu đậm, hover nền kem đậm hơn
                `mx-2 flex items-center gap-3 rounded-md py-2.5 pr-4 pl-4 text-sm transition-colors ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                } ${
                  isActive
                    ? "bg-white font-bold text-brass-deep"
                    : "font-semibold text-[#2b2118] hover:bg-[#EDE5D8]"
                }`
              }
            >
              {item.icon && <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />}
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              {badgeCountOf(item.path) > 0 && (
                <span
                  className={`ml-auto rounded-full bg-brass-deep px-2 py-0.5 text-[11px] leading-none font-semibold text-white ${collapsed ? "lg:hidden" : ""}`}
                  aria-label={`${badgeCountOf(item.path)} thông báo mới`}
                >
                  Mới
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Nút thu gọn / mở rộng — chỉ màn lớn (mobile dùng ngăn kéo) */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            aria-expanded={!collapsed}
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            className={`hidden cursor-pointer items-center gap-3 border-t border-[#E6DDCF] py-3 pr-4 pl-6 text-sm font-medium text-[#6B5A47] transition-colors hover:bg-[#EDE5D8] hover:text-[#2b2118] lg:flex ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" aria-hidden="true" /> : <ChevronsLeft className="h-[18px] w-[18px]" aria-hidden="true" />}
            {!collapsed && "Thu gọn"}
          </button>
        )}
      </aside>
    </>
  );
}
