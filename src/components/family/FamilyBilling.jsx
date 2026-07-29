import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useFamily } from "@/lib/FamilyContext";
import { Loader2, CreditCard, DollarSign, Clock, Snowflake, Split, Receipt, AlertCircle } from "lucide-react";
import PaymentMethodManager from "@/components/family/billing/PaymentMethodManager";

export default function FamilyBilling() {
  const { familyGroup, isPrimaryGuardian, hasFamily } = useFamily();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMember, setFilterMember] = useState("all");
  const [freezeForm, setFreezeForm] = useState({ freeze_start: "", freeze_end: "", freeze_reason: "" });
  const [savingFreeze, setSavingFreeze] = useState(false);
  const [savingSplit, setSavingSplit] = useState(false);

  const load = async () => {
    if (!hasFamily) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getFamilyBilling");
      setData(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [hasFamily]);

  const refresh = () => { load(); };

  if (loading || !data) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;
  }

  if (!data.hasFamily) {
    return <div className="text-center py-20 text-[#A8A9AD] text-sm">Create or join a family to view billing.</div>;
  }

  const billingRecords = data.billingRecords || [];
  const paymentMethods = data.paymentMethods || [];
  const payments = data.payments || [];
  const members = data.members || [];
  const totalRecurring = data.totalRecurring || 0;

  const activeBilling = billingRecords.filter((b) => b.status === "active");
  const pastDue = billingRecords.filter((b) => b.status === "past_due" || b.status === "failed");
  const nextBillingDate = activeBilling
    .map((b) => b.next_billing_date)
    .filter(Boolean)
    .sort()[0];

  const filtered = filterMember === "all" ? payments : payments.filter((p) => p.user_id === filterMember);
  const totalPaid = filtered.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = filtered.filter((p) => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);
  const memberName = (id) => members.find((m) => m.id === id)?.full_name || "Unknown";

  const requestFreeze = async (e) => {
    e.preventDefault();
    if (!freezeForm.freeze_start || !freezeForm.freeze_end) return;
    setSavingFreeze(true);
    try {
      const active = billingRecords.filter((b) => b.status === "active");
      for (const b of active) {
        await base44.entities.BillingRecord.update(b.id, {
          freeze_start: freezeForm.freeze_start,
          freeze_end: freezeForm.freeze_end,
          freeze_reason: freezeForm.freeze_reason,
          status: "paused",
        });
      }
      setFreezeForm({ freeze_start: "", freeze_end: "", freeze_reason: "" });
      refresh();
    } catch (e) { alert("Failed to request freeze."); }
    setSavingFreeze(false);
  };

  const toggleSplitBilling = async () => {
    setSavingSplit(true);
    try {
      await base44.entities.FamilyGroup.update(familyGroup.id, {
        split_billing_enabled: !familyGroup.split_billing_enabled,
      });
      refresh();
    } catch (e) { alert("Failed to update split billing."); }
    setSavingSplit(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#A8A9AD]/20 bg-black p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-green-400" />
            <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Monthly Total</span>
          </div>
          <p className="text-xl font-bold text-green-400">${totalRecurring.toFixed(2)}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[#C9A84C]" />
            <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Next Billing</span>
          </div>
          <p className="text-xl font-bold">{nextBillingDate ? new Date(nextBillingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={14} className="text-white" />
            <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Cards on File</span>
          </div>
          <p className="text-xl font-bold">{paymentMethods.length}</p>
        </div>
        <div className={`border p-4 ${pastDue.length > 0 ? "border-red-500/40 bg-red-500/5" : "border-[#A8A9AD]/20 bg-black"}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className={pastDue.length > 0 ? "text-red-400" : "text-[#A8A9AD]"} />
            <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Past Due</span>
          </div>
          <p className={`text-xl font-bold ${pastDue.length > 0 ? "text-red-400" : ""}`}>{pastDue.length}</p>
        </div>
      </div>

      {!isPrimaryGuardian && (
        <p className="text-xs text-[#A8A9AD] border border-[#A8A9AD]/20 p-3">You have view-only access to family billing. Only the Primary Guardian can manage payment methods and billing settings.</p>
      )}

      {/* Past due alert */}
      {pastDue.length > 0 && (
        <div className="border border-red-500/40 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Billing Attention Required</p>
            <p className="text-xs text-[#A8A9AD] mt-1">You have {pastDue.length} billing record{pastDue.length !== 1 ? "s" : ""} that {pastDue.length !== 1 ? "need" : "needs"} attention. Please contact the front desk or update your payment method.</p>
          </div>
        </div>
      )}

      {/* Active Subscriptions */}
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-3">Active Subscriptions</h3>
        {activeBilling.length === 0 ? (
          <div className="border border-[#A8A9AD]/20 p-6 text-center">
            <Receipt size={24} className="mx-auto text-[#A8A9AD]/40 mb-2" />
            <p className="text-xs text-[#A8A9AD]">No active subscriptions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeBilling.map((b) => (
              <div key={b.id} className="border border-[#A8A9AD]/20 bg-black p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-medium">${(b.recurring_amount || 0).toFixed(2)} <span className="text-xs text-[#A8A9AD]">/ {b.billing_cycle === "custom" ? `day ${b.billing_cycle_date}` : b.billing_cycle}</span></p>
                  <p className="text-xs text-[#A8A9AD] mt-0.5">
                    {b.billing_cycle === "custom" ? `Bills on day ${b.billing_cycle_date} of each month` : `Bills on the ${b.billing_cycle} of each month`}
                  </p>
                  {b.applied_discount_id && <p className="text-xs text-green-400 mt-0.5">Discount applied</p>}
                </div>
                <div className="text-right">
                  {b.next_billing_date && <p className="text-xs text-[#A8A9AD]">Next: {new Date(b.next_billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>}
                  <span className="text-[9px] tracking-widest uppercase text-green-400">Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <PaymentMethodManager paymentMethods={paymentMethods} familyId={familyGroup?.id} isPrimaryGuardian={isPrimaryGuardian} onRefresh={refresh} />

      {/* Billing Controls (primary guardian only) */}
      {isPrimaryGuardian && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Split Billing */}
          <div className="border border-[#A8A9AD]/20 bg-black p-5">
            <div className="flex items-center gap-2 mb-3">
              <Split size={16} className="text-[#C9A84C]" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Split Billing</h3>
            </div>
            <p className="text-xs text-[#A8A9AD] mb-4">Enable split billing between households. Each guardian pays their portion separately.</p>
            <button
              onClick={toggleSplitBilling}
              disabled={savingSplit}
              className={`w-full py-2.5 text-xs tracking-widest uppercase font-bold transition-colors ${familyGroup?.split_billing_enabled ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"}`}
            >
              {savingSplit ? <Loader2 size={14} className="animate-spin mx-auto" /> : familyGroup?.split_billing_enabled ? "Split Billing: ON" : "Enable Split Billing"}
            </button>
            {familyGroup?.split_billing_enabled && (
              <p className="text-xs text-green-400 mt-2 text-center">Split billing is active for this household.</p>
            )}
          </div>

          {/* Freeze Request */}
          <div className="border border-[#A8A9AD]/20 bg-black p-5">
            <div className="flex items-center gap-2 mb-3">
              <Snowflake size={16} className="text-blue-400" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Request Freeze</h3>
            </div>
            <p className="text-xs text-[#A8A9AD] mb-4">Temporarily pause billing for a date range (e.g., vacation, injury recovery).</p>
            <form onSubmit={requestFreeze} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={freezeForm.freeze_start} onChange={(e) => setFreezeForm({ ...freezeForm, freeze_start: e.target.value })} className="bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-xs text-white focus:border-[#C9A84C] focus:outline-none" placeholder="Start" required />
                <input type="date" value={freezeForm.freeze_end} onChange={(e) => setFreezeForm({ ...freezeForm, freeze_end: e.target.value })} className="bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-xs text-white focus:border-[#C9A84C] focus:outline-none" placeholder="End" required />
              </div>
              <input value={freezeForm.freeze_reason} onChange={(e) => setFreezeForm({ ...freezeForm, freeze_reason: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-xs text-white focus:border-[#C9A84C] focus:outline-none" placeholder="Reason (optional)" />
              <button type="submit" disabled={savingFreeze} className="w-full py-2.5 border border-blue-400/30 text-blue-400 text-xs tracking-widest uppercase font-bold hover:bg-blue-400/10 transition-colors disabled:opacity-50">
                {savingFreeze ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Request Freeze"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Ledger */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Payment History</h3>
          <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-1.5 text-xs text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="all">All Members</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.full_name || "Unnamed"}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="border border-[#A8A9AD]/20 p-3">
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Paid (filtered)</p>
            <p className="text-lg font-bold text-green-400">${totalPaid.toFixed(2)}</p>
          </div>
          <div className="border border-[#A8A9AD]/20 p-3">
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Pending (filtered)</p>
            <p className="text-lg font-bold text-[#C9A84C]">${totalPending.toFixed(2)}</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-[#A8A9AD]/20 bg-black p-8 text-center">
            <CreditCard size={24} className="mx-auto text-[#A8A9AD]/40 mb-2" />
            <p className="text-xs text-[#A8A9AD]">No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#A8A9AD]/20 text-left">
                  <th className="py-2 px-3 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Member</th>
                  <th className="py-2 px-3 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Description</th>
                  <th className="py-2 px-3 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Amount</th>
                  <th className="py-2 px-3 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Date</th>
                  <th className="py-2 px-3 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((p) => (
                  <tr key={p.id} className="border-b border-[#A8A9AD]/10 hover:bg-white/5">
                    <td className="py-2 px-3 text-sm">{memberName(p.user_id)}</td>
                    <td className="py-2 px-3 text-sm text-[#A8A9AD]">{p.description || "—"}</td>
                    <td className="py-2 px-3 text-sm font-medium">${(p.amount || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-sm text-[#A8A9AD]">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}</td>
                    <td className="py-2 px-3">
                      <span className={"text-[9px] tracking-widest uppercase px-2 py-1 " + (p.status === "succeeded" ? "text-green-400" : p.status === "pending" ? "text-[#C9A84C]" : p.status === "failed" ? "text-red-400" : "text-[#A8A9AD]")}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}