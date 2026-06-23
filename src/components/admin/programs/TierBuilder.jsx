import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X, Trash2, Edit3, AlertTriangle } from "lucide-react";

const INTERVALS = [
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Annually" },
  { value: "one_time", label: "One-Time" },
];

const emptyTier = { tier_name: "", billing_interval: "monthly", price: 0, classes_allowed_per_week: 0, classes_allowed_per_month: 0, display_order: 0 };

export default function TierBuilder({ program, onBack }) {
  const [tiers, setTiers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTier);
  const [saving, setSaving] = useState(false);
  const [grandfatherPrompt, setGrandfatherPrompt] = useState(null);

  const load = async () => {
    try {
      const [t, e] = await Promise.all([
        base44.entities.SubscriptionTier.filter({ linked_program_id: program.id }),
        base44.entities.Enrollment.filter({ program_id: program.id, status: "active" }),
      ]);
      setTiers(t.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      setEnrollments(e);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [program.id]);

  const startAdd = () => { setForm({ ...emptyTier, display_order: tiers.length }); setEditing("new"); };
  const startEdit = (tier) => { setForm({ ...tier }); setEditing(tier.id); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.tier_name.trim()) return;
    setSaving(true);
    try {
      if (editing === "new") {
        await base44.entities.SubscriptionTier.create({
          ...form,
          linked_program_id: program.id,
          program_name: program.program_name,
          is_active: true,
        });
      } else {
        const original = tiers.find(t => t.id === editing);
        const priceChanged = original && Number(original.price) !== Number(form.price);
        if (priceChanged) {
          setGrandfatherPrompt({ tierId: editing, originalPrice: Number(original.price), newPrice: Number(form.price), formData: { ...form } });
          setSaving(false);
          setEditing(null);
          return;
        }
        await base44.entities.SubscriptionTier.update(editing, form);
      }
      setEditing(null);
      setForm(emptyTier);
      load();
    } catch (e) { alert("Failed to save tier: " + e.message); }
    setSaving(false);
  };

  const applyGrandfather = async (applyToAll) => {
    const { tierId, formData } = grandfatherPrompt;
    setSaving(true);
    try {
      await base44.entities.SubscriptionTier.update(tierId, formData);
      if (applyToAll) {
        const linked = enrollments.filter(en => en.linked_tier_id === tierId);
        for (const en of linked) {
          await base44.entities.Enrollment.update(en.id, { locked_in_price: formData.price });
        }
        alert(`Price updated for all ${linked.length} enrolled student(s).`);
      } else {
        const linked = enrollments.filter(en => en.linked_tier_id === tierId).length;
        alert(`Price updated for new enrollments only. ${linked} existing student(s) keep their locked-in rate.`);
      }
      setGrandfatherPrompt(null);
      load();
    } catch (e) { alert("Failed to update: " + e.message); }
    setSaving(false);
  };

  const deleteTier = async (tier) => {
    if (!confirm(`Delete tier "${tier.tier_name}"? This does not affect currently enrolled students.`)) return;
    try {
      await base44.entities.SubscriptionTier.delete(tier.id);
      load();
    } catch (e) { alert("Failed to delete tier."); }
  };

  const tierEnrollmentCount = (tierId) => enrollments.filter(en => en.linked_tier_id === tierId).length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Subscription Tiers</h2>
          <p className="text-xs text-[#A8A9AD] mt-1">{program.program_name} • Pricing & attendance caps</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-[#A8A9AD] hover:text-white">← Back to Roster</button>
          <button onClick={startAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
            <Plus size={16} /> Add Tier
          </button>
        </div>
      </div>

      {tiers.length === 0 && !editing ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <p className="text-[#A8A9AD]">No subscription tiers yet. Create tiers like "Basic", "Unlimited", or "Annual Pay-In-Full".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map(tier => (
            <div key={tier.id} className="border border-[#A8A9AD]/20 bg-black p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-sm">{tier.tier_name}</h3>
                    <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 border border-[#C9A84C]/30 text-[#C9A84C]">{tier.billing_interval}</span>
                    {!tier.is_active && <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 border border-red-400/30 text-red-400">Inactive</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-[#A8A9AD]">Price</span><p className="font-bold text-[#C9A84C] text-base">${tier.price}</p></div>
                    <div><span className="text-[#A8A9AD]">Classes/Week</span><p className="font-medium">{tier.classes_allowed_per_week || "Unlimited"}</p></div>
                    <div><span className="text-[#A8A9AD]">Classes/Month</span><p className="font-medium">{tier.classes_allowed_per_month || "Unlimited"}</p></div>
                    <div><span className="text-[#A8A9AD]">Enrolled</span><p className="font-medium">{tierEnrollmentCount(tier.id)}</p></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(tier)} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C]"><Edit3 size={16} /></button>
                  <button onClick={() => deleteTier(tier)} className="p-2 text-[#A8A9AD] hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editing === "new" ? "Add Subscription Tier" : "Edit Tier"}</h3>
              <button onClick={() => setEditing(null)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Tier Name *</label>
                <input value={form.tier_name} onChange={e => setForm({ ...form, tier_name: e.target.value })} placeholder="e.g. Basic, VIP Unlimited, 10-Class Pass" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Billing Interval</label>
                  <select value={form.billing_interval} onChange={e => setForm({ ...form, billing_interval: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Price ($)</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Classes/Week (0 = unlimited)</label>
                  <input type="number" value={form.classes_allowed_per_week} onChange={e => setForm({ ...form, classes_allowed_per_week: parseInt(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Classes/Month (0 = unlimited)</label>
                  <input type="number" value={form.classes_allowed_per_month} onChange={e => setForm({ ...form, classes_allowed_per_month: parseInt(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save Tier"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grandfathering prompt */}
      {grandfatherPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-[#C9A84C]" />
              <h3 className="text-lg font-bold">Price Change Detected</h3>
            </div>
            <p className="text-sm text-[#A8A9AD] mb-2">
              You're changing the price from <span className="text-white font-bold">${grandfatherPrompt.originalPrice}</span> to <span className="text-[#C9A84C] font-bold">${grandfatherPrompt.newPrice}</span>.
            </p>
            <p className="text-sm text-[#A8A9AD] mb-6">
              {tierEnrollmentCount(grandfatherPrompt.tierId)} student(s) are currently enrolled in this tier. How should this price change be applied?
            </p>
            <div className="space-y-3">
              <button onClick={() => applyGrandfather(false)} disabled={saving} className="w-full text-left p-4 border border-[#A8A9AD]/30 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-colors">
                <p className="text-sm font-bold text-white">New enrollments only</p>
                <p className="text-xs text-[#A8A9AD] mt-1">Existing students keep their current locked-in rate. Recommended for annual price increases.</p>
              </button>
              <button onClick={() => applyGrandfather(true)} disabled={saving} className="w-full text-left p-4 border border-[#A8A9AD]/30 hover:border-red-400/50 hover:bg-red-400/5 transition-colors">
                <p className="text-sm font-bold text-white">Update all current students</p>
                <p className="text-xs text-[#A8A9AD] mt-1">All enrolled students will be moved to the new price on their next billing cycle.</p>
              </button>
            </div>
            <button onClick={() => setGrandfatherPrompt(null)} disabled={saving} className="w-full mt-4 text-xs text-[#A8A9AD] hover:text-white">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}