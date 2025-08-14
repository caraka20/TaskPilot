import { Outlet } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Topbar />
      <main className="max-w-7xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}