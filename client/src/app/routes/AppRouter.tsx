import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import { RequireToken, OwnerOnly } from "../../lib/guards";

// public
import LoginPage from "../../pages/LoginPage";

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
import TutonSubjects from "../../pages/tuton/Subjects"; // ⬅️ NEW

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
          <Route path="customers/:id" element={<CustomerDetailWithSidebar />} />

          {/* courses */}

          {/* config */}
          <Route path="config/global" element={<OwnerOnly><GlobalConfigPage /></OwnerOnly>} />
          <Route path="config/effective" element={<EffectiveConfigPage />} />
          <Route path="config/overrides" element={<OwnerOnly><OverridesConfigPage /></OwnerOnly>} />

          {/* KARIL */}
          <Route path="karil" element={<KarilList />} />

          {/* TUTON */}
          <Route path="/tuton-subjects"  element={<TutonSubjects  />} /> {/* ⬅️ NEW */}
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
