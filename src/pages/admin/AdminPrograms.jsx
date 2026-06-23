import { useState } from "react";
import { Users, BarChart3, CreditCard, TrendingUp } from "lucide-react";
import ProgramOverview from "@/components/admin/programs/ProgramOverview";
import ProgramRoster from "@/components/admin/programs/ProgramRoster";
import PnLDashboard from "@/components/admin/programs/PnLDashboard";
import ExpenseTracker from "@/components/admin/programs/ExpenseTracker";
import PayrollManager from "@/components/admin/programs/PayrollManager";
import ProfitabilityReport from "@/components/admin/programs/ProfitabilityReport";

export default function AdminPrograms() {
  const [tab, setTab] = useState("programs");
  const [selectedProgram, setSelectedProgram] = useState(null);

  const tabs = [
    { id: "programs", label: "Programs", icon: Users },
    { id: "financials", label: "Financials", icon: BarChart3 },
    { id: "payroll", label: "Payroll", icon: CreditCard },
    { id: "profitability", label: "Profitability", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Command Center</p>
        <h1 className="text-3xl font-bold">Program & Financial Management</h1>
      </div>

      <div className="flex gap-1 border border-[#A8A9AD]/20 p-1 overflow-x-auto scrollbar-hide w-full sm:w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelectedProgram(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium tracking-wide whitespace-nowrap transition-colors ${
                tab === t.id ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "programs" && !selectedProgram && <ProgramOverview onSelect={setSelectedProgram} />}
      {tab === "programs" && selectedProgram && <ProgramRoster program={selectedProgram} onBack={() => setSelectedProgram(null)} />}
      {tab === "financials" && (
        <div className="space-y-8">
          <PnLDashboard />
          <ExpenseTracker />
        </div>
      )}
      {tab === "payroll" && <PayrollManager />}
      {tab === "profitability" && <ProfitabilityReport />}
    </div>
  );
}