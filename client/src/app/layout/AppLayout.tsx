// src/app/layout/AppLayout.tsx
import { Suspense } from "react";
import { Spinner } from "@heroui/react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import MobileNavigation from "../../components/layout/MobileNavigation";
import { useThemeStore } from "../../store/theme.store";
import { useUIStore } from "../../store/ui.store";
import { useAuthStore } from "../../store/auth.store";

export default function AppLayout() {
  const { dark } = useThemeStore();
  const token = useAuthStore((state) => state.token);
  const { sidebarCollapsed: collapsed } = useUIStore();
  const { pathname } = useLocation();

  const standalone = pathname === "/login" || pathname.startsWith("/public/");
  const showNavigation = !standalone && Boolean(token);
  const contentMaxW = collapsed ? "max-w-[1600px]" : "max-w-[1480px]";

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
            : "app-grid-background min-h-dvh min-w-0 flex-1 overflow-x-clip px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))] sm:px-5 lg:h-dvh lg:overflow-y-auto lg:px-7 lg:py-6 xl:px-8"
        }
      >
        <div
          className={
            !showNavigation
              ? "min-h-dvh w-full"
              : `app-page-enter mx-auto w-full ${contentMaxW} transition-[max-width] duration-300 ease-out`
          }
        >
          <Suspense
            fallback={
              <div className="grid min-h-[50dvh] place-items-center" role="status" aria-live="polite">
                <Spinner color="primary" label="Memuat halaman…" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
