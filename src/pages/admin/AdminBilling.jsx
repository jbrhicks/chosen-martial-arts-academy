import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PAYMENT_TYPES } from "@/lib/constants";
import { Loader2, Plus, DollarSign, X, CreditCard } from "lucide-react";
import SubscriptionFreezeManager from "@/components/admin/billing/SubscriptionFreezeManager";

export default function AdminBilling() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCharge, setShowCharge] = useState(false);
  const [chargeForm, setChargeForm] = useState({ user_id: "", amount: "", payment_type: "custom", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      const data = await base44.entities.Payment.list();
      setPayments(data.sort((a, b) => new Date(b.payment_date || b.created_date || 0) - new Date(a.payment_date || a.created_date || 0)));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPayments();
    base44.entities.User.list().then(setUsers).catch(() => {});
  }, [loadPayments]);

  const totalRevenue = payments.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleCharge = async (e) => {
    e.preventDefault();
    if (!chargeForm.user_id || !chargeForm.amount) return;
    setSubmitting(true);
    try {
      const selectedUser = users.find((u) => u.id === chargeForm.user_id);
      await base44.entities.Payment.create({
        user_id: chargeForm.user_id,
        user_name: selectedUser?.full_name || "",
        amount: parseFloat(chargeForm.amount),
        payment_type: chargeForm.payment_type,
        description: chargeForm.description || PAYMENT_TYPES[chargeForm.payment_type]?.label || "Custom Charge",
        status: "succeeded",
        payment_date: new Date().toISOString(),
      });
      setShowCharge(false);
      setChargeForm({ user_id: "", amount: "", payment_type: "custom", description: "" });
      loadPayments();
    } catch (e) {
      alert("Failed to create charge: " + e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Financial Management</p>
          <h1 className="text-3xl font-bold">Billing & POS</h1>
        </div>
        <button
          onClick={() => setShowCharge(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors"
        >
          <Plus size={18} /> New Charge
        </button>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#A8A9AD]/20 border border-[#A8A9AD]/20">
        <div className="bg-[#0A0A0A] p-6">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-[#C9A84C]">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#0A0A0A] p-6">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Transactions</p>
          <p className="text-2xl font-bold">{payments.length}</p>
        </div>
        <div className="bg-[#0A0A0A] p-6">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Subscriptions</p>
          <p className="text-2xl font-bold">{payments.filter((p) => p.payment_type === "subscription").length}</p>
        </div>
        <div className="bg-[#0A0A0A] p-6">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Retail Sales</p>
          <p className="text-2xl font-bold">{payments.filter((p) => p.payment_type === "retail").length}</p>
        </div>
      </div>

      {/* Payments list */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : payments.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <CreditCard size={32} className="text-[#A8A9AD] mx-auto mb-3" />
          <p className="text-[#A8A9AD]">No transactions yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#A8A9AD]/20 text-left">
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Student</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Description</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Type</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Date</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium text-right">Amount</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-[#A8A9AD]/10 hover:bg-white/5">
                  <td className="py-3 px-4 text-sm">{p.user_name || "—"}</td>
                  <td className="py-3 px-4 text-sm text-[#A8A9AD]">{p.description || "—"}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] tracking-widest uppercase text-[#C9A84C]">{PAYMENT_TYPES[p.payment_type]?.label || p.payment_type}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#A8A9AD]">
                    {new Date(p.payment_date || p.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-right">${(p.amount || 0).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] tracking-widest uppercase ${
                      p.status === "succeeded" ? "text-green-400" :
                      p.status === "failed" ? "text-red-400" :
                      p.status === "pending" ? "text-[#C9A84C]" : "text-[#A8A9AD]"
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subscriptions & Freezes */}
      <SubscriptionFreezeManager />

      {/* Charge modal */}
      {showCharge && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowCharge(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">New Charge</h2>
              <button onClick={() => setShowCharge(false)} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCharge} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Student *</label>
                <select
                  value={chargeForm.user_id}
                  onChange={(e) => setChargeForm({ ...chargeForm, user_id: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  required
                >
                  <option value="">Select student...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Charge Type *</label>
                <select
                  value={chargeForm.payment_type}
                  onChange={(e) => setChargeForm({ ...chargeForm, payment_type: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                >
                  {Object.entries(PAYMENT_TYPES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={chargeForm.amount}
                  onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  placeholder="50.00"
                  required
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
                <input
                  type="text"
                  value={chargeForm.description}
                  onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  placeholder="e.g. Yellow belt testing fee"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <><DollarSign size={16} /> Process Charge</>}
              </button>
              <p className="text-xs text-[#A8A9AD] text-center">Note: Stripe payment processing requires a Builder+ plan. This records the transaction in the system.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}