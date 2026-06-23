import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { GraduationCap, X, Loader2, DollarSign } from "lucide-react";

export default function ProgramManager({ user, enrollments, programs, tiers, onRefresh, logActivity }) {
  const [editingTier, setEditingTier] = useState(null);
  const [tierForm, setTierForm] = useState({ linked_tier_id: "", locked_in_price: 0 });
  const [saving, setSaving] = useState(false);

  const activeEnrollments = enrollments.filter(e => e.status === "active");

  const dropProgram = async (enrollment) => {
    if (!confirm(`Drop ${enrollment.program}? This will cancel the enrollment.`)) return;
    try {
      await base44.entities.Enrollment.update(enrollment.id, { status: "cancelled" });
      await logActivity("enrollment", `Dropped program: ${enrollment.program}`);
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
  };

  const transferProgram = async (enrollment, newProgramId) => {
    const program = programs.find(p => p.id === newProgramId);
    if (!program) return;
    try {
      await base44.entities.Enrollment.update(enrollment.id, { program: program.program_name, program_id: program.id });
      await logActivity("enrollment", `Transferred from ${enrollment.program} to ${program.program_name}`);
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
  };

  const startEditTier = (enrollment) => {
    setEditingTier(enrollment.id);
    setTierForm({ linked_tier_id: enrollment.linked_tier_id || "", locked_in_price: enrollment.locked_in_price || 0 });
  };

  const saveTier = async (enrollment) => {
    setSaving(true);
    try {
      await base44.entities.Enrollment.update(enrollment.id, tierForm);
      await logActivity("enrollment", `Override tier for ${enrollment.program}: price=$${tierForm.locked_in_price}/mo`);
      setEditingTier(null);
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
    setSaving(false);
  };

  if (activeEnrollments.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-8 text-center">
        <GraduationCap size={32} className="text-[#A8A9AD] mx-auto mb-3" />
        <p className="text-[#A8A9AD]">No active program enrollments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeEnrollments.map(enroll => {
        const enrollTiers = tiers.filter(t => t.linked_program_id === enroll.program_id && t.is_active !== false);
        return (
          <div key={enroll.id} className="border border-[#A8A9AD]/20 bg-black p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{enroll.program}</h3>
                <p className="text-xs text-[#A8A9AD]">Since {enroll.start_date} · Belt: {enroll.belt_rank || "White"}</p>
                {enroll.locked_in_price > 0 && <p className="text-xs text-[#C9A84C] mt-1">Locked-in rate: ${enroll.locked_in_price}/mo</p>}
              </div>
              <span className="text-xs text-[#C9A84C] font-bold uppercase tracking-wide bg-[#C9A84C]/10 px-2 py-1">Active</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <select onChange={e => transferProgram(enroll, e.target.value)} defaultValue="" className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-1.5 text-xs text-white focus:border-[#C9A84C] focus:outline-none">
                <option value="" disabled>Transfer to...</option>
                {programs.filter(p => p.id !== enroll.program_id && p.status !== "inactive").map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
              </select>
              <button onClick={() => dropProgram(enroll)} className="flex items-center gap-1 px-3 py-1.5 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wide hover:bg-red-500/10">
                <X size={14} /> Drop Program
              </button>
              <button onClick={() => startEditTier(enroll)} className="flex items-center gap-1 px-3 py-1.5 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wide hover:bg-[#C9A84C]/10">
                <DollarSign size={14} /> Override Tier
              </button>
            </div>
            {editingTier === enroll.id && (
              <div className="mt-4 p-4 border border-[#C9A84C]/30 bg-[#C9A84C]/5 space-y-3">
                <div>
                  <label className="block text-xs text-[#A8A9AD] uppercase tracking-wide mb-1">Subscription Tier</label>
                  <select value={tierForm.linked_tier_id} onChange={e => setTierForm({...tierForm, linked_tier_id: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    <option value="">No tier</option>
                    {enrollTiers.map(t => <option key={t.id} value={t.id}>{t.tier_name} - ${t.price}/{t.billing_interval}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#A8A9AD] uppercase tracking-wide mb-1">Locked-in Monthly Rate ($)</label>
                  <input type="number" value={tierForm.locked_in_price} onChange={e => setTierForm({...tierForm, locked_in_price: parseFloat(e.target.value) || 0})} className="w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveTier(enroll)} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs uppercase hover:bg-[#E0C97A] disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save Override
                  </button>
                  <button onClick={() => setEditingTier(null)} className="px-4 py-2 text-xs text-[#A8A9AD] hover:text-white">Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}