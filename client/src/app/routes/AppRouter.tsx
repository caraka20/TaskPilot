// client/src/router/AppRouter.tsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import { RequireToken, OwnerOnly } from "../../lib/guards";
import AppLoadingScreen from "../../components/common/AppLoadingScreen";

const LoginPage = lazy(() => import("../../pages/LoginPage"));
const TutonPublicPage = lazy(() => import("../../pages/public/TutonPublicPage"));
const DashboardPage = lazy(() => import("../../pages/DashboardPage"));
const CustomersList = lazy(() => import("../../pages/customers/CustomersList"));
const CustomerDetailWithSidebar = lazy(
  () => import("../../pages/customers/components/CustomerDetailWithSidebar")
);
const GlobalConfigPage = lazy(() => import("../../pages/config/GlobalConfigPage"));
const EffectiveConfigPage = lazy(() => import("../../pages/config/EffectiveConfigPage"));
const OverridesConfigPage = lazy(() => import("../../pages/config/OverridesConfigPage"));
const UsersList = lazy(() => import("../../pages/users/UsersList"));
const UserDetailPage = lazy(() => import("../../pages/users/UserDetail"));
const RegisterUser = lazy(() => import("../../pages/users/RegisterUser"));
const KarilList = lazy(() => import("../../pages/customers/KarilList"));
const MetodePenelitianList = lazy(
  () => import("../../pages/customers/MetodePenelitianList")
);
const TutonSubjects = lazy(() => import("../../pages/tuton/Subjects"));
const TutonList = lazy(() => import("../../pages/tuton/TutonList"));
const NotFoundPage = lazy(() => import("../../pages/NotFoundPage"));
const AttendancePage = lazy(() => import("../../attendance/AttendancePage"));
const AccountSettingsPage = lazy(() => import("../../pages/account/AccountSettingsPage"));

function PageLoader() {
  return <AppLoadingScreen fullScreen label="Menyiapkan ARTECH" description="Memuat modul aplikasi yang Anda perlukan." />;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
        {/* ===== Public routes (no auth) ===== */}
        <Route path="login" element={<LoginPage />} />
        <Route path="public/report" element={<TutonPublicPage />} /> {/* ⬅️ NEW */}

        {/* index -> dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* ===== Protected routes ===== */}
        <Route element={<RequireToken />}>
          {/* dashboard */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="account" element={<AccountSettingsPage />} />

          {/* USERS (OWNER only) */}
          <Route
            path="users"
            element={
              <OwnerOnly>
                <UsersList />
              </OwnerOnly>
            }
          />
          <Route
            path="users/register"
            element={
              <OwnerOnly>
                <RegisterUser />
              </OwnerOnly>
            }
          />
          <Route
            path="users/:username"
            element={
              <OwnerOnly>
                <UserDetailPage />
              </OwnerOnly>
            }
          />

          {/* customers */}
          <Route path="customers" element={<CustomersList />} />
          <Route path="customers/:id" element={<CustomerDetailWithSidebar />} />

          {/* config */}
          <Route
            path="config/global"
            element={
              <OwnerOnly>
                <GlobalConfigPage />
              </OwnerOnly>
            }
          />
          <Route
            path="config/effective"
            element={
              <OwnerOnly>
                <EffectiveConfigPage />
              </OwnerOnly>
            }
          />
          <Route
            path="config/overrides"
            element={
              <OwnerOnly>
                <OverridesConfigPage />
              </OwnerOnly>
            }
          />

          {/* KARIL */}
          <Route path="karil" element={<KarilList />} />
          <Route path="metode-penelitian" element={<MetodePenelitianList />} />

          {/* TUTON (internal/protected) */}
          <Route path="tuton" element={<TutonList />} />
          <Route path="tuton-subjects" element={<TutonSubjects />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
