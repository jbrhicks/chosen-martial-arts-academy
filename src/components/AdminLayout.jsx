import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard, Users, CreditCard, Video, MessageSquare, Calendar, CalendarDays, UserPlus, LogOut, Menu, X, TrendingUp, ClipboardCheck, BarChart3, BookOpen, ListChecks, FormInput, Tag, Inbox, Tablet, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Leads", path: "/admin/leads", icon: UserPlus },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Onboarding", path: "/admin/onboarding", icon: UserPlus },
    { label: "Programs & Finance", path: "/admin/programs", icon: BarChart3 },
    { label: "Billing", path: "/admin/billing", icon: CreditCard },
    { label: "Discounts", path: "/admin/discounts", icon: Tag },
    { label: "Curriculum", path: "/admin/curriculum", icon: Video },
    { label: "Curriculum Builder", path: "/admin/curriculum-builder", icon: BookOpen },
    { label: "Progress", path: "/admin/progress", icon: TrendingUp },
    { label: "Evaluation", path: "/admin/evaluation", icon: ListChecks },
    { label: "Attendance", path: "/admin/attendance", icon: ClipboardCheck },
    { label: "Front Desk Kiosk", path: "/front-desk", icon: Tablet, external: true },
    { label: "Membership Requests", path: "/admin/membership-requests", icon: Inbox },
    { label: "Age Overrides", path: "/admin/exception-requests", icon: ShieldAlert },
    { label: "Community", path: "/admin/community", icon: MessageSquare },
    { label: "Events", path: "/admin/events", icon: Calendar },
    { label: "Custom Fields", path: "/admin/custom-fields", icon: FormInput },
    { label: "Schedule", path: "/admin/schedule", icon: CalendarDays },
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
            <div className="w-9 h-9 border-2 border-[#C9A84C] flex items-center justify-center bg-[#C9A84C]">
              <span className="text-black font-bold text-lg">C</span>
            </div>
            <div className="leading-none">
              <div className="font-bold text-xs tracking-widest uppercase">Chosen</div>
              <div className="text-[9px] tracking-[0.15em] text-[#C9A84C] uppercase">Admin Dashboard</div>
            </div>
          </Link>
        </div>

        <div className="p-4 border-b border-[#A8A9AD]/20 shrink-0">
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
          </div>
        </div>

        <nav className="p-4 flex flex-col gap-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const linkClass = `flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wide transition-all ${
              isActive(item.path)
                ? "bg-[#C9A84C]/10 text-[#C9A84C] border-l-2 border-[#C9A84C]"
                : "text-[#A8A9AD] hover:text-white hover:bg-white/5 border-l-2 border-transparent"
            }`;
            if (item.external) {
              return (
                <a key={item.path} href={item.path} target="_blank" rel="noopener noreferrer" onClick={() => setSidebarOpen(false)} className={linkClass}>
                  <Icon size={18} />
                  {item.label}
                </a>
              );
            }
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={linkClass}>
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
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-[#A8A9AD]/20 bg-black sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-2">
            <Menu size={22} />
          </button>
          <span className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Admin</span>
          <div className="w-10" />
        </header>

        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}