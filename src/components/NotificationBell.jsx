import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  getNotificationLink, getNotificationIcon, formatNotificationTime,
} from "@/lib/notificationLinks";

const ADMIN_FILTERS = [
  { val: "all", label: "All" },
  { val: "new_lead", label: "Leads" },
  { val: "enrollment", label: "Enrollments" },
  { val: "account_request", label: "Billing" },
  { val: "dm", label: "Messages" },
];

export default function NotificationBell({ isAdmin = false, align = "right" }) {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visible = isAdmin
    ? notifications.filter(n => filter === "all" || n.notification_type === filter)
    : notifications;

  const handleClick = async (n) => {
    await markAsRead(n.id);
    setOpen(false);
    navigate(getNotificationLink(n, isAdmin));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-[#A8A9AD] hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-h-[70vh] bg-[#0A0A0A] border border-[#A8A9AD]/30 z-[60] flex flex-col shadow-2xl ${align === "left" ? "left-full ml-2" : "right-0"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#A8A9AD]/20">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#C9A84C]" />
              <span className="text-sm font-bold tracking-wide uppercase">
                {isAdmin ? "Admin Alerts" : "Notifications"}
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-[#A8A9AD] hover:text-[#C9A84C] transition-colors px-2 py-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={12} /> Clear All
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-[#A8A9AD] hover:text-white">
                <X size={14} />
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-1 px-3 py-2 border-b border-[#A8A9AD]/20 overflow-x-auto scrollbar-hide">
              {ADMIN_FILTERS.map(f => (
                <button
                  key={f.val}
                  onClick={() => setFilter(f.val)}
                  className={`px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                    filter === f.val
                      ? "bg-[#C9A84C] text-black"
                      : "text-[#A8A9AD] hover:text-white border border-[#A8A9AD]/20"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#A8A9AD]">Loading…</div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#A8A9AD]">
                <Bell size={28} className="mx-auto mb-2 opacity-40" />
                You're all caught up.
              </div>
            ) : (
              visible.map(n => {
                const Icon = getNotificationIcon(n.notification_type);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-[#A8A9AD]/10 hover:bg-white/5 transition-colors ${
                      !n.is_read ? "bg-[#C9A84C]/5" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 shrink-0 flex items-center justify-center ${!n.is_read ? "bg-[#C9A84C]/15 text-[#C9A84C]" : "bg-white/5 text-[#A8A9AD]"}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.is_read ? "text-white font-medium" : "text-[#A8A9AD]"}`}>
                        {n.preview_text}
                      </p>
                      <p className="text-[10px] text-[#A8A9AD] mt-1">{formatNotificationTime(n.created_date)}</p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 bg-[#C9A84C] rounded-full shrink-0 mt-1.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}