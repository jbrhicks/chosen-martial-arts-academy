import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Download, Plus, Loader2, X } from "lucide-react";

const INCOME_CATEGORIES = ["tuition", "retail", "testing", "events", "other"];
const PIE_COLORS = ["#C9A84C", "#A8A9AD", "#10b981", "#3b82f6", "#ef4444"];

export default function PnLDashboard() {
  const [ledger, setLedger] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("monthly");
  const [showIncome, setShowIncome] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ category: "tuition", amount: "", description: "", program_id: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [l, p] = await Promise.all([
        base44.entities.GeneralLedger.list("-date", 500),
        base44.entities.Program.list(),
      ]);
      setLedger(l);
      setPrograms(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getStartDate = (r) => {
    const now = new Date();
    switch (r) {
      case "weekly": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "monthly": return new Date(now.getFullYear(), now.getMonth(), 1);
      case "quarterly": return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      case "annually": return new Date(now.getFullYear(), 0, 1);
      default: return new Date(0);
    }
  };

  const startDate = getStartDate(range);
  const filtered = ledger.filter(d => new Date(d.date) >= startDate);
  const income = filtered.filter(d => d.type === "income").reduce((s, d) => s + (d.amount || 0), 0);
  const expenses = filtered.filter(d => d.type === "expense").reduce((s, d) => s + (d.amount || 0), 0);
  const profit = income - expenses;

  // Chart data - last 6 months
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toLocaleDateString("en-US", { month: "short" });
    const monthLedger = ledger.filter(l => { const ld = new Date(l.date); return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear(); });
    const inc = monthLedger.filter(l => l.type === "income").reduce((s, l) => s + (l.amount || 0), 0);
    const exp = monthLedger.filter(l => l.type === "expense").reduce((s, l) => s + (l.amount || 0), 0);
    chartData.push({ month: monthKey, income: inc, expenses: exp, profit: inc - exp });
  }

  // Income by category
  const incomeByCategory = INCOME_CATEGORIES.map(cat => ({
    name: cat,
    value: filtered.filter(d => d.type === "income" && d.category === cat).reduce((s, d) => s + (d.amount || 0), 0),
  })).filter(d => d.value > 0);

  const handleLogIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount) return;
    setSaving(true);
    try {
      await base44.entities.GeneralLedger.create({
        type: "income",
        amount: parseFloat(incomeForm.amount),
        date: new Date().toISOString(),
        category: incomeForm.category,
        description: incomeForm.description,
        program_id: incomeForm.program_id || undefined,
      });
      setShowIncome(false);
      setIncomeForm({ category: "tuition", amount: "", description: "", program_id: "" });
      load();
    } catch (e) { alert("Failed to log income."); }
    setSaving(false);
  };

  const exportCSV = () => {
    const headers = ["Date", "Type", "Category", "Amount", "Description", "Program ID"];
    const rows = filtered.map(d => [new Date(d.date).toLocaleDateString(), d.type, d.category, d.amount, d.description || "", d.program_id || ""]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chosen-financials-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold">Profit & Loss</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 border border-[#A8A9AD]/20 p-1">
            {["weekly", "monthly", "quarterly", "annually"].map(r => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 text-xs tracking-widest uppercase transition-colors ${range === r ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>{r}</button>
            ))}
          </div>
          <button onClick={() => setShowIncome(true)} className="flex items-center gap-2 px-3 py-2 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold tracking-wide uppercase hover:bg-[#C9A84C]/10 transition-colors">
            <Plus size={14} /> Log Income
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 border border-[#A8A9AD]/30 text-[#A8A9AD] text-xs font-bold tracking-wide uppercase hover:text-white transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-green-400/20 bg-green-400/5 p-5">
          <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-green-400" /><p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Gross Income</p></div>
          <p className="text-2xl font-bold text-green-400">${income.toFixed(2)}</p>
        </div>
        <div className="border border-red-400/20 bg-red-400/5 p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-red-400" /><p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Total Expenses</p></div>
          <p className="text-2xl font-bold text-red-400">${expenses.toFixed(2)}</p>
        </div>
        <div className={`border p-5 ${profit >= 0 ? "border-[#C9A84C]/30 bg-[#C9A84C]/5" : "border-red-400/20 bg-red-400/5"}`}>
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className={profit >= 0 ? "text-[#C9A84C]" : "text-red-400"} /><p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Net Profit</p></div>
          <p className={`text-2xl font-bold ${profit >= 0 ? "text-[#C9A84C]" : "text-red-400"}`}>${profit.toFixed(2)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#A8A9AD20" />
              <XAxis dataKey="month" stroke="#A8A9AD" fontSize={11} />
              <YAxis stroke="#A8A9AD" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid #A8A9AD30", borderRadius: 0 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" fill="#C9A84C" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Net Profit Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#A8A9AD20" />
              <XAxis dataKey="month" stroke="#A8A9AD" fontSize={11} />
              <YAxis stroke="#A8A9AD" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid #A8A9AD30", borderRadius: 0 }} />
              <Line type="monotone" dataKey="profit" stroke="#C9A84C" strokeWidth={2} name="Net Profit" dot={{ fill: "#C9A84C" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income breakdown */}
      {incomeByCategory.length > 0 && (
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Income by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: $${value.toFixed(0)}`} labelLine={false} style={{ fontSize: 11 }}>
                {incomeByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid #A8A9AD30", borderRadius: 0 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log income modal */}
      {showIncome && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowIncome(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Log Income</h3>
              <button onClick={() => setShowIncome(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleLogIncome} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Category</label>
                <select value={incomeForm.category} onChange={e => setIncomeForm({ ...incomeForm, category: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Amount ($) *</label>
                <input type="number" value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Program (optional)</label>
                <select value={incomeForm.program_id} onChange={e => setIncomeForm({ ...incomeForm, program_id: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  <option value="">None</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
                <input value={incomeForm.description} onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="e.g. March tuition payment" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Log Income"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}