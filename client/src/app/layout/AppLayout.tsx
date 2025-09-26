// src/app/layout/AppLayout.tsx
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";   // ⬅️ add useLocation
import Sidebar from "../../components/layout/Sidebar";
import { useThemeStore } from "../../store/theme.store";
import { useUIStore } from "../../store/ui.store";

export default function AppLayout() {
  const { dark } = useThemeStore();
  const { sidebarCollapsed: collapsed } = useUIStore();
  const { pathname } = useLocation();

  // Hide sidebar on public pages
  const hideSidebar =
    pathname.startsWith("/public/report"); // add more routes if needed
  const showSidebar = !hideSidebar;

  // ensure <html> has "dark" so portals follow the theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // dynamic paddings for main when sidebar is hidden
  const mainPadding = showSidebar
    ? "pl-2 pr-4 sm:pl-3 lg:pl-4 lg:pr-6"
    : "px-4 sm:px-6 lg:px-10";

  // when sidebar exists and not collapsed, cap width for readability
  const contentMaxW =
    showSidebar && !collapsed ? "max-w-[1400px]" : "max-w-none";

  return (
    <div
      className={`${dark ? "dark" : ""} h-screen w-full flex
                  bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100`}
    >
      {showSidebar && <Sidebar />}

      {/* Right content */}
      <main
        className={`flex-1 min-w-0 h-screen overflow-y-auto
                    ${mainPadding} py-4
                    transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)]`}
      >
        <div
          className={`w-full ${contentMaxW}
                      transition-[max-width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]`}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
