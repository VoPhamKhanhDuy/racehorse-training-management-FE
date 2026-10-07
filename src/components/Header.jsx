import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import useAuth from "../hooks/useAuth";
import roles from "../data/roles";

// Thanh trên cùng: avatar mở menu tài khoản (tên, vai trò, Đăng xuất). onMenuClick mở sidebar trên mobile.
export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleName = roles.find((role) => role.id === user.roleId)?.name ?? user.roleId;
  const initial = user.fullName.trim().charAt(0).toUpperCase();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null); // bao cả nút avatar + dropdown, để biết click có nằm ngoài không
  const avatarButtonRef = useRef(null);
  const logoutItemRef = useRef(null);

  // Khi menu mở: đưa focus vào mục đầu tiên, đóng khi click ra ngoài hoặc nhấn Escape
  useEffect(() => {
    if (!menuOpen) return;
    logoutItemRef.current?.focus();

    const handleMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        avatarButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone/15 bg-white px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="cursor-pointer rounded-sm p-2 text-stone hover:bg-stone/10 lg:hidden"
        aria-label="Mở menu"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      <div ref={menuRef} className="relative ml-auto">
        <button
          ref={avatarButtonRef}
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="account-menu"
          aria-label={`Tài khoản: ${user.fullName}`}
          className="flex cursor-pointer items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-black/5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/20 font-serif font-semibold text-brass-deep">
            {initial}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-stone transition-transform ${menuOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {menuOpen && (
          <div
            id="account-menu"
            role="menu"
            aria-label="Tài khoản"
            className="absolute top-full right-0 z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-md border border-stone/15 bg-white py-1 shadow-md"
          >
            {/* Thông tin tài khoản: chỉ để đọc, không phải mục bấm được */}
            <div role="presentation" className="px-4 py-3">
              <p className="truncate font-semibold text-ink">{user.fullName}</p>
              <p className="mt-0.5 text-sm text-stone">{roleName}</p>
            </div>
            <div role="separator" className="my-1 border-t border-stone/15" />
            <button
              ref={logoutItemRef}
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-black/5 focus:bg-black/5 focus:outline-none"
            >
              <LogOut className="h-4 w-4 text-stone" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
