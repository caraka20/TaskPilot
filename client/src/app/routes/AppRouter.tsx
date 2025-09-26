// client/src/router/AppRouter.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import { RequireToken, OwnerOnly } from "../../lib/guards";

// public
import LoginPage from "../../pages/LoginPage";
import TutonPublicPage from "../../pages/public/TutonPublicPage"; // ⬅️ NEW

// protected pages
import DashboardPage from "../../pages/DashboardPage";
import CustomersList from "../../pages/customers/CustomersList";
import CustomerDetailWithSidebar from "../../pages/customers/components/CustomerDetailWithSidebar";

import GlobalConfigPage from "../../pages/config/GlobalConfigPage";
import EffectiveConfigPage from "../../pages/config/EffectiveConfigPage";
import OverridesConfigPage from "../../pages/config/OverridesConfigPage";

import UsersList from "../../pages/users/UsersList";
import UserDetailPage from "../../pages/users/UserDetail";
import RegisterUser from "../../pages/users/RegisterUser";

// KARIL pages
import KarilList from "../../pages/customers/KarilList";

// TUTON pages
import TutonSubjects from "../../pages/tuton/Subjects";
import TutonList from "../../pages/tuton/TutonList";

// 404 page
import NotFoundPage from "../../pages/NotFoundPage";

export default function AppRouter() {
  return (
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
          <Route path="config/effective" element={<EffectiveConfigPage />} />
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

          {/* TUTON (internal/protected) */}
          <Route path="tuton" element={<TutonList />} />
          <Route path="tuton-subjects" element={<TutonSubjects />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
