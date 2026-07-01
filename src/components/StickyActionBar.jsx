import { Calendar } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function StickyActionBar() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#C9A84C] py-2.5 px-6 flex items-center justify-between">
      <span className="text-black font-bold text-xs tracking-widest uppercase">Free 1-Week Trial</span>
      <a href="#lead-form" className="bg-black text-[#C9A84C] font-bold text-xs tracking-widest uppercase px-4 py-2 flex items-center gap-1.5">
        <Calendar size={14} /> Book Now
      </a>
    </div>
  );
}