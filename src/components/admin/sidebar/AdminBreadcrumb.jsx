import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { getBreadcrumb } from "./navConfig";

export default function AdminBreadcrumb() {
  const location = useLocation();
  const crumb = getBreadcrumb(location.pathname);
  if (!crumb) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-[#A8A9AD] mb-4 flex-wrap">
      <Link to="/admin" className="flex items-center gap-1 hover:text-white transition-colors">
        <Home size={12} />
        Admin
      </Link>
      {crumb.groupLabel && (
        <>
          <ChevronRight size={12} className="text-[#A8A9AD]/50" />
          <span className="text-[#A8A9AD]">{crumb.groupLabel}</span>
        </>
      )}
      <ChevronRight size={12} className="text-[#A8A9AD]/50" />
      <span className="text-white font-medium">{crumb.itemLabel}</span>
    </div>
  );
}