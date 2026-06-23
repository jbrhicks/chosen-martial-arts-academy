import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

export default function ProfitabilityReport() {
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, e, l] = await Promise.all([
          base44.entities.Program.list(),
          base44.entities.Enrollment.filter({ status: "active" }),
          base44.entities.GeneralLedger.list("-date", 500),
        ]);
        setPrograms(p);
        setEnrollments(e);
        setLedger(l);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  const programData = programs.map(prog => {
    const activeCount = enrollments.filter(e => e.program_id === prog.id || e.program === prog.program_name).length;
    const mrr = activeCount * (prog.default_monthly_rate || 0);
    const income = ledger.filter(l => l.type === "income" && l.program_id === prog.id).reduce((s, l) => s + (l.amount || 0), 0);
    const expenses = ledger.filter(l => l.type === "expense" && l.program_id === prog.id).reduce((s, l) => s + (l.amount || 0), 0);
    const revenue = income > 0 ? income : mrr;
    const profit = revenue - expenses;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
    return { program: prog, activeCount, mrr, income, expenses, revenue, profit, margin };
  });

  const totalRevenue = programData.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = programData.reduce((s, d) => s + d.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Program Profitability Analysis</h2>
        <p className="text-sm text-[#A8A9AD] mt-1">Revenue minus program-specific expenses to show true profit margins.</p>
      </div>

      {/* Overall summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Net Profit</p>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-[#C9A84C]" : "text-red-400"}`}>${totalProfit.toFixed(2)}</p>
        </div>
      </div>

      {/* Per-program breakdown */}
      {programData.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <p className="text-[#A8A9AD]">No programs to analyze.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programData.map(({ program, activeCount, mrr, income, expenses, revenue, profit, margin }) => (
            <div key={program.id} className="border border-[#A8A9AD]/20 bg-black p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm">{program.program_name}</h3>
                  <p className="text-xs text-[#A8A9AD]">{program.age_group} • {activeCount} active students • MRR: ${mrr.toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${profit >= 0 ? "text-[#C9A84C]" : "text-red-400"}`}>${profit.toFixed(2)}</p>
                  <p className={`text-xs flex items-center gap-1 justify-end ${margin >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {margin >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {margin}% margin
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border-l-2 border-green-400/30 pl-3">
                  <p className="text-xs text-[#A8A9AD]">Revenue</p>
                  <p className="font-medium text-green-400">${revenue.toFixed(2)}</p>
                  {income > 0 && <p className="text-[10px] text-[#A8A9AD]">Logged: ${income.toFixed(2)}</p>}
                </div>
                <div className="border-l-2 border-red-400/30 pl-3">
                  <p className="text-xs text-[#A8A9AD]">Expenses</p>
                  <p className="font-medium text-red-400">${expenses.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-white/10 overflow-hidden flex">
                <div className="bg-green-400" style={{ width: `${revenue > 0 ? (expenses / revenue) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-[#A8A9AD] mt-1">Expense ratio: {revenue > 0 ? Math.round((expenses / revenue) * 100) : 0}% of revenue</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}