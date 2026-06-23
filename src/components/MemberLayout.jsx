import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { Home, Video, Users, Calendar, CreditCard, LogOut, Menu, TrendingUp, UserCog, Eye, Map } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { FamilyProvider, useFamily } from "@/lib/FamilyContext";
import BeltBadge from "@/components/BeltBadge";
import ProfileSwitcher from "@/components/family/ProfileSwitcher";

function MemberLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isGuardian, isViewingAsChild, activeProfile, resetProfile } = useFamily();

  const navItems = [
    { label: "Dashboard", path: "/portal", icon: Home },
    { label: "Curriculum", path: "/portal/curriculum", icon: Video },
    { label: "Progression", path: "/portal/progress", icon: TrendingUp },
    { label: "My Journey", path: "/portal/journey", icon: Map },
    { label: "Community", path: "/portal/community", icon: Users },
    { label: "Events", path: "/portal/events", icon: Calendar },
    { label: "Billing", path: "/portal/billing", icon: CreditCard },
    ...(isGuardian ? [{ label: "Family", path: "/portal/family", icon: UserCog }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-black border-r border-[#A8A9AD]/20 z-50 transition-transform duration-300 flex flex-col ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="h-20 flex items-center px-6 border-b border-[#A8A9AD]/20 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 border-2 border-[#C9A84C] flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-lg">C</span>
            </div>
            <div className="leading-none">
              <div className="font-bold text-xs tracking-widest uppercase">Chosen</div>
              <div className="text-[9px] tracking-[0.15em] text-[#A8A9AD] uppercase">Member Portal</div>
            </div>
          </Link>
        </div>

        {/* User card */}
        <div className="p-4 border-b border-[#A8A9AD]/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-sm">
                {user?.full_name?.charAt(0) || "S"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || "Student"}</p>
              {user?.belt_rank && <BeltBadge rank={user.belt_rank} size="sm" />}
            </div>
          </div>
        </div>

        {/* Profile Switcher */}
        <ProfileSwitcher />

        <nav className="p-4 flex flex-col gap-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wide transition-all ${
                  isActive(item.path)
                    ? "bg-[#C9A84C]/10 text-[#C9A84C] border-l-2 border-[#C9A84C]"
                    : "text-[#A8A9AD] hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#A8A9AD]/20 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#A8A9AD] hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-[#A8A9AD]/20 bg-black sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-2">
            <Menu size={22} />
          </button>
          <span className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Chosen</span>
          <div className="w-10" />
        </header>

        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {isViewingAsChild && (
            <div className="mb-6 border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Eye size={18} className="text-[#C9A84C] shrink-0" />
                <div>
                  <p className="text-sm font-medium">Viewing as {activeProfile?.full_name}</p>
                  <p className="text-xs text-[#A8A9AD]">Curriculum and progress are filtered to their rank.</p>
                </div>
              </div>
              <button onClick={resetProfile} className="text-xs text-[#C9A84C] tracking-widest uppercase font-medium hover:text-[#E0C97A]">
                Back to My Profile
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function MemberLayout() {
  return (
    <FamilyProvider>
      <MemberLayoutContent />
    </FamilyProvider>
  );
}