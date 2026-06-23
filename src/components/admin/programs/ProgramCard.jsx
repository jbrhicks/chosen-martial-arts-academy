import { Users, DollarSign, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export default function ProgramCard({ program, enrollments, onClick }) {
  const active = enrollments.filter(e => (e.program_id === program.id || e.program === program.program_name) && e.status === "active");
  const activeCount = active.length;
  const mrr = activeCount * (program.default_monthly_rate || 0);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const recent = active.filter(e => new Date(e.start_date) >= thirtyDaysAgo).length;
  const previous = active.filter(e => { const d = new Date(e.start_date); return d >= sixtyDaysAgo && d < thirtyDaysAgo; }).length;
  const growth = previous > 0 ? Math.round(((recent - previous) / previous) * 100) : recent > 0 ? 100 : 0;
  const isFull = program.max_capacity > 0 && activeCount >= program.max_capacity;

  return (
    <button onClick={onClick} className="border border-[#A8A9AD]/20 bg-black p-5 text-left hover:border-[#C9A84C]/40 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm">{program.program_name}</h3>
          <p className="text-xs text-[#A8A9AD] mt-0.5">{program.age_group}</p>
        </div>
        <ArrowRight size={16} className="text-[#A8A9AD] group-hover:text-[#C9A84C] transition-colors" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#A8A9AD]" />
            <span className="text-xs text-[#A8A9AD]">Active Students</span>
          </div>
          <span className="text-lg font-bold">{activeCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-[#A8A9AD]" />
            <span className="text-xs text-[#A8A9AD]">Monthly MRR</span>
          </div>
          <span className="text-lg font-bold text-[#C9A84C]">${mrr.toFixed(0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {growth >= 0 ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
            <span className="text-xs text-[#A8A9AD]">30-Day Growth</span>
          </div>
          <span className={`text-sm font-bold ${growth >= 0 ? "text-green-400" : "text-red-400"}`}>{growth >= 0 ? "+" : ""}{growth}%</span>
        </div>
      </div>
      {program.max_capacity > 0 && (
        <div className="mt-4 pt-3 border-t border-[#A8A9AD]/10">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#A8A9AD]">Capacity</span>
            <span className={isFull ? "text-red-400 font-bold" : "text-white"}>{activeCount}/{program.max_capacity}{isFull ? " — Full" : ""}</span>
          </div>
          <div className="h-1.5 bg-white/10 overflow-hidden">
            <div className={`h-full transition-all ${isFull ? "bg-red-400" : "bg-[#C9A84C]"}`} style={{ width: `${Math.min((activeCount / program.max_capacity) * 100, 100)}%` }} />
          </div>
        </div>
      )}
    </button>
  );
}