import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export function RequireToken() {
  const { token } = useAuthStore();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />;
  return <Outlet />;
}

export function OwnerOnly({ children }: { children: React.ReactNode }) {
  const { role } = useAuthStore();
  const isOwner = (role ?? "").toUpperCase() === "OWNER";
  if (!isOwner) return <Navigate to="/customers" replace />;
  return <>{children}</>;
}