import { Calendar } from "lucide-react";

export default function StickyActionBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#C9A84C] py-2.5 px-4 flex items-center justify-between lg:hidden">
      <span className="text-black font-bold text-xs tracking-widest uppercase">Free 2-Week Trial</span>
      <a href="/#lead-form" className="bg-black text-[#C9A84C] font-bold text-xs tracking-widest uppercase px-4 py-2 flex items-center gap-1.5">
        <Calendar size={14} /> Book Now
      </a>
    </div>
  );
}