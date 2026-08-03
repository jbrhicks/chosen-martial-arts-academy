import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export default function NavigationItem({
  item,
  isActive,
  isFavorite,
  onToggleFavorite,
  collapsed,
  onNavigate,
}) {
  const Icon = item.icon;
  const active = isActive(item.path);

  if (item.external) {
    return (
      <a
        href={item.path}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-sm ${
          active ? "bg-[#C9A84C]/10 text-[#C9A84C]" : "text-[#A8A9AD] hover:text-white hover:bg-white/5"
        }`}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      </a>
    );
  }

  return (
    <div className="flex items-center group/item">
      <Link
        to={item.path}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-sm flex-1 min-w-0 ${
          active ? "bg-[#C9A84C]/10 text-[#C9A84C]" : "text-[#A8A9AD] hover:text-white hover:bg-white/5"
        }`}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      </Link>
      {!collapsed && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(item.path);
          }}
          className="p-1.5 mr-1 opacity-0 group-hover/item:opacity-100 transition-opacity"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            size={14}
            className={isFavorite ? "fill-[#C9A84C] text-[#C9A84C]" : "text-[#A8A9AD]"}
          />
        </button>
      )}
    </div>
  );
}