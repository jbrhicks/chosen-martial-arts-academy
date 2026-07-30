import { Link, useLocation } from "react-router-dom";
import { Home, CalendarClock, Users, Video, UserCircle } from "lucide-react";

const ITEMS = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Schedule", path: "/portal/schedule", icon: CalendarClock },
  { label: "Community", path: "/portal/community", icon: Users },
  { label: "Vault", path: "/portal/curriculum", icon: Video },
  { label: "Profile", path: "/portal/profile", icon: UserCircle },
];

export default function BottomNav() {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-black border-t border-[#A8A9AD]/20 flex">
      {ITEMS.map((it) => {
        const Icon = it.icon;
        const active = location.pathname === it.path;
        return (
          <Link
            key={it.path}
            to={it.path}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
              active ? "text-[#C9A84C]" : "text-[#A8A9AD]"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] tracking-wide">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}