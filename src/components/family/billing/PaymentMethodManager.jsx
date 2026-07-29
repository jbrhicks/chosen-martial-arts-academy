import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { CreditCard, Plus, Trash2, Star, X, Loader2, Check } from "lucide-react";

const BRANDS = ["Visa", "Mastercard", "Amex", "Discover", "Other"];

export default function PaymentMethodManager({ paymentMethods, familyId, isPrimaryGuardian, onRefresh }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cardholder_name: "", card_brand: "Visa", last4: "", expiration_date: "" });
  const [saving, setSaving] = useState(false);

  const addCard = async (e) => {
    e.preventDefault();
    if (form.last4.length < 4) return;
    setSaving(true);
    try {
      const isFirst = paymentMethods.length === 0;
      await base44.entities.PaymentMethod.create({
        family_id: familyId,
        cardholder_name: form.cardholder_name || user.full_name,
        card_brand: form.card_brand,
        last4: form.last4,
        expiration_date: form.expiration_date || undefined,
        is_default: isFirst,
      });
      setShowForm(false);
      setForm({ cardholder_name: "", card_brand: "Visa", last4: "", expiration_date: "" });
      onRefresh();
    } catch (e) { alert("Failed to add payment method."); }
    setSaving(false);
  };

  const setDefault = async (pm) => {
    // Unset other defaults first
    for (const other of paymentMethods.filter((p) => p.is_default)) {
      await base44.entities.PaymentMethod.update(other.id, { is_default: false });
    }
    await base44.entities.PaymentMethod.update(pm.id, { is_default: true });
    onRefresh();
  };

  const removeCard = async (pm) => {
    if (!confirm(`Remove card ending in ${pm.last4}?`)) return;
    await base44.entities.PaymentMethod.delete(pm.id);
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Payment Methods</h3>
        {isPrimaryGuardian && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] tracking-widest uppercase font-bold hover:bg-[#C9A84C]/10 transition-colors">
            <Plus size={12} /> Add Card
          </button>
        )}
      </div>

      {paymentMethods.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-6 text-center">
          <CreditCard size={24} className="mx-auto text-[#A8A9AD]/40 mb-2" />
          <p className="text-xs text-[#A8A9AD]">No payment methods on file.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className="border border-[#A8A9AD]/20 bg-black p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-[#C9A84C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {pm.card_brand} •••• {pm.last4}
                  {pm.is_default && <span className="text-[10px] text-[#C9A84C] tracking-wide uppercase ml-2">Default</span>}
                </p>
                <p className="text-xs text-[#A8A9AD]">{pm.cardholder_name}{pm.expiration_date && ` • Exp ${new Date(pm.expiration_date).toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" })}`}</p>
              </div>
              {isPrimaryGuardian && (
                <div className="flex items-center gap-1 shrink-0">
                  {!pm.is_default && (
                    <button onClick={() => setDefault(pm)} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C] transition-colors" title="Set as default">
                      <Star size={14} />
                    </button>
                  )}
                  <button onClick={() => removeCard(pm)} className="p-2 text-[#A8A9AD] hover:text-red-400 transition-colors" title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-sm border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Add Payment Method</h3>
              <button onClick={() => setShowForm(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addCard} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Cardholder Name</label>
                <input value={form.cardholder_name} onChange={(e) => setForm({ ...form, cardholder_name: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder={user?.full_name || "Name on card"} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Card Brand</label>
                <select value={form.card_brand} onChange={(e) => setForm({ ...form, card_brand: e.target.value })} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Last 4 Digits *</label>
                  <input value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="1234" maxLength={4} required />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Expiration</label>
                  <input type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={saving || form.last4.length < 4} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Save Card</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}