import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function AdminRoute() {
  const { user, authChecked, isLoadingAuth } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-8 h-8 border-4 border-[#A8A9AD]/20 border-t-[#C9A84C] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}