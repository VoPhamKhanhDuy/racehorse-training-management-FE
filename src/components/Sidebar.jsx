import { Link, NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import roleMenus from "../routes/roleMenus";
import roleHomePaths from "../routes/roleHomePaths";

// Menu bên trái, đổi theo role. isOpen/onClose chỉ dùng cho màn hình nhỏ (dạng ngăn kéo).
export default function Sidebar({ isOpen = false, onClose }) {
  const { user } = useAuth();
  const menuItems = roleMenus[user.roleId] || [];

  return (
    <>
      {/* Lớp nền mờ khi mở menu trên mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-[#232328]/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-stone/15 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-stone/15 px-6">
          <Link to={roleHomePaths[user.roleId] || "/"} className="font-serif text-2xl font-semibold tracking-tight text-ink">
            Equi<span className="text-brass">Track</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                // Mục đang chọn: chữ cam đậm + vạch cam sát mép trái, không tô nền
                `relative flex items-center gap-3 py-2.5 pr-4 pl-6 text-sm transition-colors ${
                  isActive
                    ? "font-semibold text-brass-deep before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:bg-brass"
                    : "text-ink hover:bg-black/[0.03]"
                }`
              }
            >
              {item.icon && <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
