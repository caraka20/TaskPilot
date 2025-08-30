import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import { RequireToken, OwnerOnly } from "../../lib/guards";

// public
import LoginPage from "../../pages/LoginPage";

// protected pages
import DashboardPage from "../../pages/DashboardPage";
import CustomersList from "../../pages/customers/CustomersList";
import CustomerDetail from "../../pages/customers/CustomerDetail";
import ConflictsPage from "../../pages/courses/ConflictsPage";

import GlobalConfigPage from "../../pages/config/GlobalConfigPage";
import EffectiveConfigPage from "../../pages/config/EffectiveConfigPage";
import OverridesConfigPage from "../../pages/config/OverridesConfigPage";

import UsersList from "../../pages/users/UsersList";
import UserDetailPage from "../../pages/users/UserDetail";
import RegisterUser from "../../pages/users/RegisterUser";

// KARIL pages (lokasi sesuai punyamu)
import KarilList from "../../pages/customers/KarilList";
import TutonConflicts from "../../pages/tuton/Conflicts";

// 404 page
import NotFoundPage from "../../pages/NotFoundPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* public */}
        <Route path="login" element={<LoginPage />} />

        {/* index -> dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* protected */}
        <Route element={<RequireToken />}>
          {/* dashboard */}
          <Route path="dashboard" element={<DashboardPage />} />

          {/* USERS (OWNER only) */}
          <Route path="users" element={<OwnerOnly><UsersList /></OwnerOnly>} />
          <Route path="users/register" element={<OwnerOnly><RegisterUser /></OwnerOnly>} />
          <Route path="users/:username" element={<OwnerOnly><UserDetailPage /></OwnerOnly>} />

          {/* customers */}
          <Route path="customers" element={<CustomersList />} />
          <Route path="customers/:id" element={<CustomerDetail />} />

          {/* courses */}
          <Route path="courses/conflicts" element={<ConflictsPage />} />

          {/* config */}
          <Route path="config/global" element={<OwnerOnly><GlobalConfigPage /></OwnerOnly>} />
          <Route path="config/effective" element={<EffectiveConfigPage />} />
          <Route path="config/overrides" element={<OwnerOnly><OverridesConfigPage /></OwnerOnly>} />

          {/* KARIL (OWNER only) */}
          <Route path="karil" element={<KarilList />} />

          {/* TUTON */}
          <Route path="/tuton-conflicts" element={<TutonConflicts />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
