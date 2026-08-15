// src/app/layout/AppLayout.tsx
import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import MobileNavigation from "../../components/layout/MobileNavigation";
import { useThemeStore } from "../../store/theme.store";
import { useUIStore } from "../../store/ui.store";
import { useAuthStore } from "../../store/auth.store";
import AppLoadingScreen from "../../components/common/AppLoadingScreen";

export default function AppLayout() {
  const { dark } = useThemeStore();
  const token = useAuthStore((state) => state.token);
  const { sidebarCollapsed: collapsed } = useUIStore();
  const { pathname } = useLocation();

  const standalone = pathname === "/login" || pathname.startsWith("/public/");
  const showNavigation = !standalone && Boolean(token);
  const isCustomerDetail = /^\/customers\/[^/]+\/?$/.test(pathname);
  const contentMaxW = isCustomerDetail
    ? "max-w-none"
    : collapsed
      ? "max-w-[1600px]"
      : "max-w-[1480px]";
  const authenticatedMainSpacing = isCustomerDetail
    ? "px-2 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(4.5rem+env(safe-area-inset-top))] sm:px-3 lg:px-3 lg:py-3 xl:px-4"
    : "px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))] sm:px-5 lg:px-7 lg:py-6 xl:px-8";

  return (
    <div
      className={`${dark ? "dark" : ""} min-h-dvh w-full text-slate-900 dark:text-slate-100 lg:flex`}
    >
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Lewati ke konten utama
      </a>

      {showNavigation && <Sidebar />}
      {showNavigation && <MobileNavigation />}

      <main
        id="main-content"
        className={
          !showNavigation
            ? "min-h-dvh min-w-0 flex-1"
            : `app-grid-background min-h-dvh min-w-0 flex-1 overflow-x-clip lg:h-dvh lg:overflow-y-auto ${authenticatedMainSpacing}`
        }
      >
        <div
          key={pathname}
          className={
            !showNavigation
              ? "min-h-dvh w-full"
              : `app-page-enter mx-auto w-full ${contentMaxW}`
          }
        >
          <Suspense
            fallback={
              <AppLoadingScreen
                fullScreen
                label="Membuka halaman"
                description="Menyiapkan tampilan dan data terbaru untuk ruang kerja Anda."
              />
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
