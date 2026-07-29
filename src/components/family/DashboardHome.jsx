import { useFamily } from "@/lib/FamilyContext";
import { useFamilyDashboard } from "@/hooks/useFamilyDashboard";
import BeltBadge from "@/components/BeltBadge";
import { Loader2, Mail, CreditCard, FileText, UserPlus, Crown, Shield, GraduationCap, AlertTriangle, CheckCircle, XCircle, Calendar, Award } from "lucide-react";

const ROLE_CONFIG = {
  primary_guardian: { label: "Primary Guardian", icon: Crown, color: "text-[#C9A84C]" },
  secondary_guardian: { label: "Secondary Guardian", icon: Shield, color: "text-[#A8A9AD]" },
  student: { label: "Student", icon: GraduationCap, color: "text-white" },
};

const FLAG_STYLES = {
  ready_to_test: { icon: Award, color: "text-green-400", bg: "bg-green-400/10", label: "Ready to Test" },
  needs_help: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Needs Help" },
  behavior: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10", label: "Behavior" },
  injury: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", label: "Injury" },
};

export default function DashboardHome({ onTabChange }) {
  const { familyGroup, members, isPrimaryGuardian } = useFamily();
  const { data, loading } = useFamilyDashboard();

  if (loading || !data) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  const students = data.students || [];
  const actionItems = data.actionItems || [];
  const billing = data.billing || [];

  const totalMonthly = billing
    .filter(b => b.status === "active")
    .reduce((sum, b) => sum + (b.recurring_amount || 0), 0);

  const now = new Date();
  const totalClassesThisMonth = students.reduce((sum, s) => {
    return sum + (s.attendance || []).filter(a => {
      const d = new Date(a.check_in_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Family header */}
      <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Family Group</p>
            <h2 className="text-2xl font-bold">{familyGroup?.family_name || "My Family"}</h2>
            <p className="text-sm text-[#A8A9AD] mt-1">{members.length} members • {students.length} student{students.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Billing Status</p>
            <span className={`text-sm font-bold uppercase tracking-wide ${familyGroup?.billing_status === "active" ? "text-green-400" : familyGroup?.billing_status === "past_due" ? "text-red-400" : "text-[#A8A9AD]"}`}>
              {familyGroup?.billing_status || "none"}
            </span>
            {totalMonthly > 0 && <p className="text-xs text-[#A8A9AD] mt-1">${totalMonthly.toFixed(2)}/mo</p>}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Calendar} label="Classes This Month" value={totalClassesThisMonth} />
        <StatCard icon={GraduationCap} label="Active Students" value={students.length} />
        <StatCard icon={CreditCard} label="Monthly Total" value={`$${totalMonthly.toFixed(2)}`} />
        <StatCard icon={AlertTriangle} label="Action Items" value={actionItems.length} highlight={actionItems.length > 0} />
      </div>

      {/* Action Required */}
      {actionItems.length > 0 && (
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Action Required
          </h3>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <div key={i} className={`border p-4 flex items-start gap-3 ${
                item.severity === "danger" ? "border-red-500/40 bg-red-500/5" :
                item.severity === "success" ? "border-green-500/40 bg-green-500/5" :
                "border-yellow-500/40 bg-yellow-500/5"
              }`}>
                <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                  item.severity === "danger" ? "bg-red-500/15 text-red-400" :
                  item.severity === "success" ? "bg-green-500/15 text-green-400" :
                  "bg-yellow-500/15 text-yellow-400"
                }`}>
                  {item.severity === "danger" ? <XCircle size={16} /> : item.severity === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{item.title}</p>
                  {item.detail && <p className="text-xs text-[#A8A9AD] mt-1">{item.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      {isPrimaryGuardian && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction icon={Mail} label="Communications" desc="CC emails & phones" onClick={() => onTabChange("communications")} />
          <QuickAction icon={CreditCard} label="Family Billing" desc="Consolidated ledger" onClick={() => onTabChange("billing")} />
          <QuickAction icon={FileText} label="Documents" desc="Sign waivers" onClick={() => onTabChange("documents")} />
          <QuickAction icon={UserPlus} label="Invite" desc="Add members" onClick={() => onTabChange("invite")} />
        </div>
      )}

      {/* Members */}
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Family Members</h3>
        <div className="space-y-2">
          {members.map((m) => {
            const cfg = ROLE_CONFIG[m.family_role] || ROLE_CONFIG.student;
            const Icon = cfg.icon;
            const studentData = students.find(s => s.id === m.id);
            const flags = studentData?.flags || [];
            const attendanceCount = (studentData?.attendance || []).length;
            return (
              <div key={m.id} className="border border-[#A8A9AD]/20 bg-black p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-sm font-bold text-[#C9A84C] shrink-0">
                    {m.full_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.full_name || "Unnamed"}</p>
                    <p className="text-xs text-[#A8A9AD] truncate">{m.email}</p>
                  </div>
                  <div className="hidden sm:block">
                    {m.belt_rank && <BeltBadge rank={m.belt_rank} size="sm" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className={cfg.color} />
                    <span className={`text-[10px] tracking-widest uppercase ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
                {flags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#A8A9AD]/10">
                    {flags.map((f, i) => {
                      const fs = FLAG_STYLES[f.flag_type] || FLAG_STYLES.needs_help;
                      const FIcon = fs.icon;
                      return (
                        <span key={i} className={`flex items-center gap-1 px-2 py-1 text-[10px] tracking-wide uppercase font-medium ${fs.bg} ${fs.color}`}>
                          <FIcon size={11} /> {fs.label}
                        </span>
                      );
                    })}
                  </div>
                )}
                {studentData && attendanceCount > 0 && (
                  <p className="text-xs text-[#A8A9AD] mt-2">{attendanceCount} total check-ins</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`border p-4 ${highlight ? "border-red-500/40 bg-red-500/5" : "border-[#A8A9AD]/20 bg-black"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={highlight ? "text-red-400" : "text-[#C9A84C]"} />
        <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, onClick }) {
  return (
    <button onClick={onClick} className="group border border-[#A8A9AD]/20 p-4 text-left hover:border-[#C9A84C]/40 transition-colors">
      <div className="w-9 h-9 border border-[#C9A84C]/30 flex items-center justify-center mb-3 group-hover:bg-[#C9A84C] transition-colors">
        <Icon size={16} className="text-[#C9A84C] group-hover:text-black transition-colors" />
      </div>
      <h4 className="font-bold text-sm mb-0.5">{label}</h4>
      <p className="text-xs text-[#A8A9AD]">{desc}</p>
    </button>
  );
}