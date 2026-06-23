import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronLeft, Mail, ArrowRightLeft, AlertTriangle, CheckCircle, Settings, Send, X, Layers, ArrowUpCircle } from "lucide-react";
import TierBuilder from "./TierBuilder";
import TierUpgradeModal from "./TierUpgradeModal";
import { BELT_RANKS } from "@/lib/constants";

export default function ProgramRoster({ program, onBack }) {
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [showEmail, setShowEmail] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTiers, setShowTiers] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [emailForm, setEmailForm] = useState({ subject: "", body: "" });
  const [transferTarget, setTransferTarget] = useState("");
  const [capacity, setCapacity] = useState(program.max_capacity || 0);
  const [ageMin, setAgeMin] = useState(program.age_minimum || 0);
  const [ageMax, setAgeMax] = useState(program.age_maximum || 0);
  const [prereqRank, setPrereqRank] = useState(program.prerequisite_rank || "");
  const [dropInPrice, setDropInPrice] = useState(program.drop_in_price || 0);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const [allEnroll, att, allPrograms, allTiers] = await Promise.all([
        base44.entities.Enrollment.list(),
        base44.entities.AttendanceRecord.list().catch(() => []),
        base44.entities.Program.list(),
        base44.entities.SubscriptionTier.filter({ linked_program_id: program.id }).catch(() => []),
      ]);
      setEnrollments(allEnroll.filter(e => e.program_id === program.id || e.program === program.program_name));
      setAttendance(att);
      setPrograms(allPrograms.filter(p => p.id !== program.id));
      setTiers(allTiers);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [program.id]);

  const getAttendanceHealth = (enrollment) => {
    if (!enrollment.user_id) return { status: "pending", days: null };
    const studentAtt = attendance.filter(a => a.user_id === enrollment.user_id);
    if (studentAtt.length === 0) return { status: "no_data", days: null };
    const lastCheckIn = new Date(Math.max(...studentAtt.map(a => new Date(a.check_in_date))));
    const days = Math.floor((new Date() - lastCheckIn) / (24 * 60 * 60 * 1000));
    return { status: days > 14 ? "flagged" : "healthy", days };
  };

  const toggleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const handleBulkEmail = async (e) => {
    e.preventDefault();
    const emails = enrollments.filter(en => selected.includes(en.id)).map(en => en.user_email).filter(Boolean);
    if (emails.length === 0) return;
    setSending(true);
    try {
      for (const email of emails) {
        await base44.integrations.Core.SendEmail({ to: email, subject: emailForm.subject, body: emailForm.body });
      }
      alert(`Email sent to ${emails.length} student(s).`);
      setShowEmail(false);
      setEmailForm({ subject: "", body: "" });
      setSelected([]);
    } catch (e) { alert("Failed to send emails."); }
    setSending(false);
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    const target = programs.find(p => p.id === transferTarget);
    if (!target) return;
    try {
      for (const id of selected) {
        const en = enrollments.find(e => e.id === id);
        if (en) await base44.entities.Enrollment.update(id, { program_id: target.id, program: target.program_name });
      }
      alert(`Transferred ${selected.length} student(s) to ${target.program_name}.`);
      setShowTransfer(false);
      setTransferTarget("");
      setSelected([]);
      load();
    } catch (e) { alert("Failed to transfer students."); }
  };

  const saveCapacity = async () => {
    try {
      await base44.entities.Program.update(program.id, { max_capacity: capacity, age_minimum: ageMin, age_maximum: ageMax, prerequisite_rank: prereqRank, drop_in_price: dropInPrice });
      alert("Program settings updated.");
      setShowSettings(false);
    } catch (e) { alert("Failed to update settings."); }
  };

  const getTier = (enrollment) => tiers.find(t => t.id === enrollment.linked_tier_id);

  const activeCount = enrollments.filter(e => e.status === "active").length;
  const waitlist = enrollments.filter(e => e.status === "waitlist");
  const isFull = program.max_capacity > 0 && activeCount >= program.max_capacity;

  const programTiers = tiers.filter(t => t.linked_program_id === program.id && t.is_active !== false).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const priceLabel = programTiers.length > 0
    ? (() => {
        const prices = programTiers.map(t => t.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max
          ? `$${min}/${programTiers[0].billing_interval?.replace("_", " ") || "mo"}`
          : `$${min}–$${max}/${programTiers[0].billing_interval?.replace("_", " ") || "mo"} (${programTiers.length} tiers)`;
      })()
    : `$${program.default_monthly_rate || 0}/mo${program.drop_in_price ? ` • Drop-in $${program.drop_in_price}` : ""}`;

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#A8A9AD] hover:text-white transition-colors">
          <ChevronLeft size={18} /> Back
        </button>
        <div>
          <h2 className="text-xl font-bold">{program.program_name}</h2>
          <p className="text-xs text-[#A8A9AD]">{program.age_group} • {priceLabel} • {activeCount} active{isFull ? " — FULL" : ""}</p>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-[#A8A9AD]">{selected.length} selected</span>
        <button onClick={() => setShowEmail(true)} disabled={selected.length === 0} className="flex items-center gap-2 px-3 py-2 border border-[#A8A9AD]/30 text-xs font-medium text-[#A8A9AD] hover:text-white disabled:opacity-30 transition-colors">
          <Mail size={14} /> Bulk Email
        </button>
        <button onClick={() => setShowTransfer(true)} disabled={selected.length === 0} className="flex items-center gap-2 px-3 py-2 border border-[#A8A9AD]/30 text-xs font-medium text-[#A8A9AD] hover:text-white disabled:opacity-30 transition-colors">
          <ArrowRightLeft size={14} /> Transfer
        </button>
        <button onClick={() => setShowTiers(true)} className="flex items-center gap-2 px-3 py-2 border border-[#C9A84C]/30 text-xs font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors">
          <Layers size={14} /> Manage Tiers
        </button>
        <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-3 py-2 border border-[#A8A9AD]/30 text-xs font-medium text-[#A8A9AD] hover:text-white transition-colors ml-auto">
          <Settings size={14} /> Settings
        </button>
      </div>

      {/* Roster */}
      <div className="border border-[#A8A9AD]/20 bg-black divide-y divide-[#A8A9AD]/10">
        {enrollments.length === 0 ? (
          <p className="text-center py-12 text-[#A8A9AD]">No students enrolled.</p>
        ) : (
          enrollments.map(en => {
            const health = getAttendanceHealth(en);
            return (
              <div key={en.id} className="px-4 py-3 flex items-center gap-4">
                <input type="checkbox" checked={selected.includes(en.id)} onChange={() => toggleSelect(en.id)} className="accent-[#C9A84C] w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{en.user_name || en.user_email}</p>
                  <p className="text-xs text-[#A8A9AD]">{en.user_email}</p>
                </div>
                <span className={`text-[9px] tracking-widest uppercase px-2 py-1 border ${
                  en.status === "active" ? "text-green-400 border-green-400/30" :
                  en.status === "waitlist" ? "text-[#C9A84C] border-[#C9A84C]/30" :
                  "text-[#A8A9AD] border-[#A8A9AD]/20"
                }`}>{en.status}</span>
                <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0">
                  {getTier(en) ? (
                    <>
                      <span className="text-[9px] tracking-widest uppercase text-[#C9A84C]">{getTier(en).tier_name}</span>
                      <span className="text-xs text-[#A8A9AD]">${en.locked_in_price || getTier(en).price}/{getTier(en).billing_interval?.replace("_", " ")?.slice(0, 3)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-[#A8A9AD]">No tier</span>
                  )}
                </div>
                <button onClick={() => { setUpgradeTarget(en); setShowUpgrade(true); }} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C] shrink-0" title="Change tier">
                  <ArrowUpCircle size={16} />
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  {health.status === "flagged" && <><AlertTriangle size={14} className="text-red-400" /><span className="text-xs text-red-400 hidden lg:inline">{health.days}d ago</span></>}
                  {health.status === "healthy" && <><CheckCircle size={14} className="text-green-400" /><span className="text-xs text-green-400 hidden lg:inline">{health.days}d ago</span></>}
                  {health.status === "no_data" && <span className="text-xs text-[#A8A9AD]">No check-ins</span>}
                  {health.status === "pending" && <span className="text-xs text-[#A8A9AD]">Pending setup</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-3">Waitlist ({waitlist.length})</h3>
          <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 divide-y divide-[#A8A9AD]/10">
            {waitlist.map(w => (
              <div key={w.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{w.user_name || w.user_email}</p>
                  <p className="text-xs text-[#A8A9AD]">{w.user_email}</p>
                </div>
                <button onClick={async () => { await base44.entities.Enrollment.update(w.id, { status: "active" }); load(); }} className="text-xs text-[#C9A84C] tracking-widest uppercase font-medium hover:text-[#E0C97A]">Promote</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email modal */}
      {showEmail && (
        <Modal title={`Email ${selected.length} Student(s)`} onClose={() => setShowEmail(false)}>
          <form onSubmit={handleBulkEmail} className="space-y-4">
            <input value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} placeholder="Subject..." className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
            <textarea value={emailForm.body} onChange={e => setEmailForm({ ...emailForm, body: e.target.value })} placeholder="Message..." rows={5} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" required />
            <button type="submit" disabled={sending} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Send to All</>}
            </button>
          </form>
        </Modal>
      )}

      {/* Transfer modal */}
      {showTransfer && (
        <Modal title="Transfer Students" onClose={() => setShowTransfer(false)}>
          <div className="space-y-4">
            <p className="text-sm text-[#A8A9AD]">Transfer {selected.length} student(s) to:</p>
            <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
              <option value="">Select program...</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
            </select>
            <button onClick={handleTransfer} disabled={!transferTarget} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
              Transfer Students
            </button>
          </div>
        </Modal>
      )}

      {/* Settings modal */}
      {showSettings && (
        <Modal title="Program Settings" onClose={() => setShowSettings(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Max Capacity</label>
              <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value) || 0)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              <p className="text-xs text-[#A8A9AD] mt-2">When capacity is reached, new enrollments are added to the waitlist.</p>
            </div>
            <div className="border-t border-[#A8A9AD]/10 pt-4">
              <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-3">Age & Prerequisite Gating</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Min Age (0 = none)</label>
                  <input type="number" value={ageMin} onChange={e => setAgeMin(parseInt(e.target.value) || 0)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Max Age (0 = none)</label>
                  <input type="number" value={ageMax} onChange={e => setAgeMax(parseInt(e.target.value) || 0)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Prerequisite Rank (blank = none)</label>
                <select value={prereqRank} onChange={e => setPrereqRank(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  <option value="">No prerequisite</option>
                  {BELT_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <p className="text-xs text-[#A8A9AD] mt-2">Enrollments that don't meet the age range or rank requirement will be blocked with a recommendation.</p>
              </div>
            </div>
            <div className="border-t border-[#A8A9AD]/10 pt-4">
              <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-3">Drop-In Class Pricing</p>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Drop-In Price ($)</label>
                <input type="number" step="0.01" value={dropInPrice} onChange={e => setDropInPrice(parseFloat(e.target.value) || 0)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                <p className="text-xs text-[#A8A9AD] mt-2">When a student reaches their weekly class limit at the kiosk, they can purchase an individual drop-in class at this price. Set to 0 to disable.</p>
              </div>
            </div>
            <button onClick={saveCapacity} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors">
              Save Settings
            </button>
          </div>
        </Modal>
      )}

      {/* Tier Builder */}
      {showTiers && <TierBuilder program={program} onBack={() => { setShowTiers(false); load(); }} />}

      {/* Upgrade/Downgrade modal */}
      {showUpgrade && upgradeTarget && (
        <TierUpgradeModal enrollment={upgradeTarget} tiers={tiers} onClose={() => setShowUpgrade(false)} onDone={() => { setShowUpgrade(false); load(); }} />
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}