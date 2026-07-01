import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Snowflake, Play, X, Calendar } from "lucide-react";

export default function SubscriptionFreezeManager() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [freezeTarget, setFreezeTarget] = useState(null);
  const [freezeForm, setFreezeForm] = useState({ freeze_end: "", freeze_reason: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.BillingRecord.list();
      setRecords(data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFreeze = async () => {
    if (!freezeTarget || !freezeForm.freeze_end) return;
    setSaving(true);
    try {
      await base44.entities.BillingRecord.update(freezeTarget.id, {
        status: "paused",
        freeze_start: new Date().toISOString().split("T")[0],
        freeze_end: freezeForm.freeze_end,
        freeze_reason: freezeForm.freeze_reason,
      });
      // Demote user to guest since their subscription is paused
      if (freezeTarget.user_email) {
        await base44.functions.invoke("syncUserRoles", { email: freezeTarget.user_email }).catch(() => {});
      }
      setFreezeTarget(null);
      setFreezeForm({ freeze_end: "", freeze_reason: "" });
      load();
    } catch (e) { alert("Failed to freeze account."); }
    setSaving(false);
  };

  const handleUnfreeze = async (record) => {
    const nextDate = new Date();
    nextDate.setDate(record.billing_cycle_date || 1);
    if (nextDate <= new Date()) nextDate.setMonth(nextDate.getMonth() + 1);
    try {
      await base44.entities.BillingRecord.update(record.id, {
        status: "active",
        freeze_start: null,
        freeze_end: null,
        freeze_reason: null,
        next_billing_date: nextDate.toISOString().split("T")[0],
      });
      // Promote user back to student since their subscription is active again
      if (record.user_email) {
        await base44.functions.invoke("syncUserRoles", { email: record.user_email }).catch(() => {});
      }
      load();
    } catch (e) { alert("Failed to unfreeze."); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  const active = records.filter(r => r.status === "active");
  const frozen = records.filter(r => r.status === "paused");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Subscriptions & Account Freezes</h2>
        <p className="text-sm text-[#A8A9AD]">Freeze memberships for vacations or injuries without cancelling. Billing resumes automatically on the scheduled date.</p>
      </div>

      {frozen.length > 0 && (
        <div>
          <h3 className="text-xs tracking-widest uppercase text-[#C9A84C] mb-3">Frozen Accounts ({frozen.length})</h3>
          <div className="space-y-2">
            {frozen.map(r => (
              <div key={r.id} className="border border-blue-400/20 bg-blue-400/5 p-4 flex items-center gap-4 flex-wrap">
                <Snowflake size={18} className="text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.user_email || "Family Account"}</p>
                  <p className="text-xs text-[#A8A9AD]">${r.recurring_amount?.toFixed(2)}/mo • Resumes: {r.freeze_end ? new Date(r.freeze_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
                  {r.freeze_reason && <p className="text-xs text-[#A8A9AD]/60 mt-1">Reason: {r.freeze_reason}</p>}
                </div>
                <button onClick={() => handleUnfreeze(r)} className="flex items-center gap-2 px-4 py-2 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A84C]/10 transition-colors">
                  <Play size={14} /> Unfreeze
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-3">Active Subscriptions ({active.length})</h3>
        {active.length === 0 ? (
          <p className="text-sm text-[#A8A9AD] py-4">No active subscriptions.</p>
        ) : (
          <div className="space-y-2">
            {active.map(r => (
              <div key={r.id} className="border border-[#A8A9AD]/20 bg-black p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.user_email || "Family Account"}</p>
                  <p className="text-xs text-[#A8A9AD]">${r.recurring_amount?.toFixed(2)}/mo • Billing on day {r.billing_cycle_date || 1} • Next: {r.next_billing_date ? new Date(r.next_billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</p>
                </div>
                <button onClick={() => { setFreezeTarget(r); setFreezeForm({ freeze_end: "", freeze_reason: "" }); }} className="flex items-center gap-2 px-4 py-2 border border-blue-400/30 text-blue-400 text-xs font-bold tracking-widest uppercase hover:bg-blue-400/10 transition-colors">
                  <Snowflake size={14} /> Freeze
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {freezeTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFreezeTarget(null)}>
          <div className="w-full max-w-md border border-blue-400/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Snowflake size={20} className="text-blue-400" />
                <h3 className="text-lg font-bold">Freeze Account</h3>
              </div>
              <button onClick={() => setFreezeTarget(null)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-[#A8A9AD]">Billing will be paused immediately and automatically resume on the date you select.</p>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Resume Date *</label>
                <input type="date" value={freezeForm.freeze_end} onChange={e => setFreezeForm({ ...freezeForm, freeze_end: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Reason (optional)</label>
                <input type="text" value={freezeForm.freeze_reason} onChange={e => setFreezeForm({ ...freezeForm, freeze_reason: e.target.value })} placeholder="e.g., Summer vacation, injury recovery" className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
              <button onClick={handleFreeze} disabled={saving || !freezeForm.freeze_end} className="w-full bg-blue-400 text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-blue-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Calendar size={16} /> Confirm Freeze</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}