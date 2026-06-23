import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Calendar, DollarSign, Loader2, RotateCcw } from "lucide-react";

export default function BillingHub({ user, family, billingRecords, paymentMethods, onRefresh, logActivity }) {
  const [editingBilling, setEditingBilling] = useState(null);
  const [billingForm, setBillingForm] = useState({ billing_cycle: "1st", billing_cycle_date: 1, next_billing_date: "" });
  const [editingCard, setEditingCard] = useState(null);
  const [cardForm, setCardForm] = useState({ cardholder_name: "", card_brand: "Visa", last4: "", expiration_date: "" });
  const [refundAmount, setRefundAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  const startEditBilling = (rec) => {
    setEditingBilling(rec.id);
    setBillingForm({ billing_cycle: rec.billing_cycle, billing_cycle_date: rec.billing_cycle_date, next_billing_date: rec.next_billing_date || "" });
  };

  const saveBilling = async (rec) => {
    setSaving(true);
    try {
      await base44.entities.BillingRecord.update(rec.id, billingForm);
      await logActivity("billing", `Updated billing cycle to ${billingForm.billing_cycle}, next date: ${billingForm.next_billing_date}`);
      setEditingBilling(null);
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
    setSaving(false);
  };

  const startEditCard = (pm) => {
    setEditingCard(pm.id);
    setCardForm({ cardholder_name: pm.cardholder_name || "", card_brand: pm.card_brand || "Visa", last4: pm.last4 || "", expiration_date: pm.expiration_date || "" });
  };

  const saveCard = async (pm) => {
    setSaving(true);
    try {
      await base44.entities.PaymentMethod.update(pm.id, cardForm);
      await logActivity("billing", `Updated card on file: ${cardForm.card_brand} ****${cardForm.last4}`);
      setEditingCard(null);
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
    setSaving(false);
  };

  const issueRefund = async () => {
    if (refundAmount <= 0) return;
    if (!confirm(`Issue a $${refundAmount} refund?`)) return;
    setSaving(true);
    try {
      await base44.entities.GeneralLedger.create({ type: "expense", amount: refundAmount, category: "tuition", date: new Date().toISOString(), description: `Refund issued to ${user?.full_name || "student"}` });
      await logActivity("billing", `Issued refund of $${refundAmount}`);
      setRefundAmount(0);
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
    setSaving(false);
  };

  const inputClass = "w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors";

  return (
    <div className="space-y-6">
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Billing Records</h3>
        {billingRecords.length === 0 ? (
          <p className="text-sm text-[#A8A9AD]">No billing records found.</p>
        ) : (
          <div className="space-y-3">
            {billingRecords.map(rec => (
              <div key={rec.id} className="border border-[#A8A9AD]/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">${rec.recurring_amount}/mo · {rec.billing_cycle}</p>
                    <p className="text-xs text-[#A8A9AD]">Next: {rec.next_billing_date || "N/A"} · Status: <span className={rec.status === "active" ? "text-green-400" : "text-red-400"}>{rec.status}</span></p>
                  </div>
                  <button onClick={() => editingBilling === rec.id ? setEditingBilling(null) : startEditBilling(rec)} className="text-xs text-[#C9A84C] hover:text-[#E0C97A] flex items-center gap-1">
                    <Calendar size={14} /> {editingBilling === rec.id ? "Cancel" : "Change Date"}
                  </button>
                </div>
                {editingBilling === rec.id && (
                  <div className="mt-3 p-3 border border-[#C9A84C]/30 bg-[#C9A84C]/5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select value={billingForm.billing_cycle} onChange={e => setBillingForm({...billingForm, billing_cycle: e.target.value})} className={inputClass}>
                        <option value="1st">1st of month</option><option value="15th">15th of month</option><option value="custom">Custom</option>
                      </select>
                      <input type="number" className={inputClass} placeholder="Day (1-31)" value={billingForm.billing_cycle_date} onChange={e => setBillingForm({...billingForm, billing_cycle_date: parseInt(e.target.value) || 1})} />
                    </div>
                    <input type="date" className={inputClass} value={billingForm.next_billing_date} onChange={e => setBillingForm({...billingForm, next_billing_date: e.target.value})} />
                    <button onClick={() => saveBilling(rec)} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs uppercase hover:bg-[#E0C97A] disabled:opacity-50">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Payment Methods</h3>
        {paymentMethods.length === 0 ? (
          <p className="text-sm text-[#A8A9AD]">No payment methods on file.</p>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map(pm => (
              <div key={pm.id} className="border border-[#A8A9AD]/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-[#C9A84C]" />
                    <div>
                      <p className="text-sm font-medium">{pm.card_brand} ****{pm.last4}</p>
                      <p className="text-xs text-[#A8A9AD]">{pm.cardholder_name} · Exp: {pm.expiration_date?.split("T")[0] || "N/A"}</p>
                    </div>
                    {pm.is_default && <span className="text-xs text-[#C9A84C] font-bold uppercase">Default</span>}
                  </div>
                  <button onClick={() => editingCard === pm.id ? setEditingCard(null) : startEditCard(pm)} className="text-xs text-[#C9A84C] hover:text-[#E0C97A]">
                    {editingCard === pm.id ? "Cancel" : "Update"}
                  </button>
                </div>
                {editingCard === pm.id && (
                  <div className="mt-3 p-3 border border-[#C9A84C]/30 bg-[#C9A84C]/5 space-y-3">
                    <input className={inputClass} placeholder="Cardholder name" value={cardForm.cardholder_name} onChange={e => setCardForm({...cardForm, cardholder_name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                      <select className={inputClass} value={cardForm.card_brand} onChange={e => setCardForm({...cardForm, card_brand: e.target.value})}>
                        <option>Visa</option><option>Mastercard</option><option>Amex</option><option>Discover</option>
                      </select>
                      <input className={inputClass} placeholder="Last 4" maxLength={4} value={cardForm.last4} onChange={e => setCardForm({...cardForm, last4: e.target.value.replace(/\D/g, "")})} />
                    </div>
                    <input type="date" className={inputClass} value={cardForm.expiration_date?.split("T")[0] || ""} onChange={e => setCardForm({...cardForm, expiration_date: e.target.value})} />
                    <button onClick={() => saveCard(pm)} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs uppercase hover:bg-[#E0C97A] disabled:opacity-50">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save Card
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Issue Refund</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <DollarSign size={20} className="text-[#A8A9AD]" />
          <input type="number" placeholder="Amount" value={refundAmount || ""} onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)} className="w-40 bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          <button onClick={issueRefund} disabled={saving || refundAmount <= 0} className="flex items-center gap-1 px-4 py-2 border border-red-500/40 text-red-400 font-bold text-xs uppercase tracking-wide hover:bg-red-500/10 disabled:opacity-50">
            <RotateCcw size={14} /> Issue Refund
          </button>
        </div>
      </div>
    </div>
  );
}