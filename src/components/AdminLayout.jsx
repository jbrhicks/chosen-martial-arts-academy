import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminSidebar from "@/components/admin/sidebar/AdminSidebar";
import AdminBreadcrumb from "@/components/admin/sidebar/AdminBreadcrumb";
import { useAdminNavSettings } from "@/hooks/useAdminNavSettings";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings, loading, toggleFavorite, toggleSidebarCollapsed, handleDragEnd } =
    useAdminNavSettings(user);

  const collapsed = settings?.sidebarCollapsed ?? false;
  const sidebarWidth = collapsed ? "w-64 lg:w-16" : "w-64 lg:w-64";
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen ${sidebarWidth} bg-black border-r border-[#A8A9AD]/20 z-50 transition-all duration-300 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div
          className={`h-20 flex items-center border-b border-[#A8A9AD]/20 shrink-0 ${
            collapsed ? "lg:justify-center lg:px-2 px-6" : "px-6"
          }`}
        >
          <Link to="/" className="flex items-center gap-3">
            <Logo size={36} />
            {!collapsed && (
              <div className="leading-none">
                <div className="font-bold text-xs tracking-widest uppercase">Chosen</div>
                <div className="text-[9px] tracking-[0.15em] text-[#C9A84C] uppercase">
                  Admin Dashboard
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* User profile */}
        <div
          className={`p-4 border-b border-[#A8A9AD]/20 shrink-0 ${
            collapsed ? "lg:flex lg:justify-center" : ""
          }`}
        >
          {collapsed ? (
            <div className="w-10 h-10 bg-[#C9A84C] flex items-center justify-center lg:mx-auto">
              <span className="text-black font-bold text-sm">
                {user?.full_name?.charAt(0) || "A"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C9A84C] flex items-center justify-center">
                <span className="text-black font-bold text-sm">
                  {user?.full_name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name || "Admin"}</p>
                <p className="text-[10px] text-[#C9A84C] tracking-widest uppercase">Administrator</p>
              </div>
              <NotificationBell isAdmin align="left" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <AdminSidebar
          settings={settings}
          loading={loading}
          isActive={isActive}
          onToggleFavorite={toggleFavorite}
          onToggleSidebarCollapsed={toggleSidebarCollapsed}
          handleDragEnd={handleDragEnd}
          collapsed={collapsed}
          onNavigate={() => setSidebarOpen(false)}
        />

        {/* Logout */}
        <div
          className={`p-4 border-t border-[#A8A9AD]/20 shrink-0 mb-16 lg:mb-0 ${
            collapsed ? "lg:flex lg:justify-center" : ""
          }`}
        >
          <button
            onClick={handleLogout}
            title={collapsed ? "Log Out" : undefined}
            className={`flex items-center gap-3 text-sm font-medium text-[#A8A9AD] hover:text-white transition-colors ${
              collapsed ? "lg:justify-center" : "px-4 py-3 w-full"
            }`}
          >
            <LogOut size={18} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-[#A8A9AD]/20 bg-black sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-2">
            <Menu size={22} />
          </button>
          <span className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">
            Admin
          </span>
          <NotificationBell isAdmin />
        </header>

        <div className="p-6 lg:p-8 pb-24 lg:pb-8">
          <AdminBreadcrumb />
          <Outlet />
        </div>
      </div>

      {/* Sticky bottom nav for mobile/tablet floor ops */}
      <AdminBottomNav />
    </div>
  );
}