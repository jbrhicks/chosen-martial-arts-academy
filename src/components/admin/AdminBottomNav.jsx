import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, UserPlus, ClipboardCheck, Inbox, Tablet } from "lucide-react";

export default function AdminBottomNav() {
  const location = useLocation();

  const items = [
    { label: "Pulse", path: "/admin", icon: LayoutDashboard },
    { label: "Leads", path: "/admin/leads", icon: UserPlus },
    { label: "Attendance", path: "/admin/attendance", icon: ClipboardCheck },
    { label: "Inbox", path: "/admin/inbox", icon: Inbox },
    { label: "Kiosk", path: "/front-desk", icon: Tablet, external: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-black border-t border-[#A8A9AD]/20 z-50">
      <div className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const className = `flex flex-col items-center justify-center gap-1 flex-1 text-[9px] tracking-widest uppercase transition-colors ${
            active ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-white"
          }`;

          if (item.external) {
            return (
              <a key={item.label} href={item.path} target="_blank" rel="noopener noreferrer" className={className}>
                <Icon size={20} />
                {item.label}
              </a>
            );
          }

          return (
            <Link key={item.label} to={item.path} className={className}>
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}