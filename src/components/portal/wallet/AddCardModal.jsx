import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Check } from "lucide-react";

export default function AddCardModal({ familyId, existingMethods, onClose, onSaved }) {
  const [form, setForm] = useState({ cardholderName: "", cardNumber: "", expiry: "", cvc: "", isDefault: existingMethods.length === 0 });
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const detectBrand = (number) => {
    const num = number.replace(/\s/g, "");
    if (num.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return "Mastercard";
    if (/^3[47]/.test(num)) return "Amex";
    if (/^6(?:011|5)/.test(num)) return "Discover";
    return "Other";
  };

  const handleSave = async () => {
    if (!form.cardholderName || !form.cardNumber || !form.expiry || !form.cvc) return;
    setSaving(true);
    try {
      const last4 = form.cardNumber.replace(/\s/g, "").slice(-4);
      const brand = detectBrand(form.cardNumber);
      const [month, year] = form.expiry.split("/");
      const expirationDate = `20${year}-${month}-01`;
      const token = `tok_${Date.now()}_${last4}`;

      if (form.isDefault) {
        for (const m of existingMethods) {
          if (m.is_default) {
            await base44.entities.PaymentMethod.update(m.id, { is_default: false });
          }
        }
      }

      await base44.entities.PaymentMethod.create({
        family_id: familyId,
        cardholder_name: form.cardholderName,
        card_brand: brand,
        last4: last4,
        expiration_date: expirationDate,
        is_default: form.isDefault,
        payment_token: token,
      });
      onSaved();
    } catch (e) { alert("Failed to save card."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Add New Card</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Cardholder Name</label>
            <input type="text" value={form.cardholderName} onChange={e => update("cardholderName", e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Card Number</label>
            <input type="text" value={form.cardNumber} onChange={e => update("cardNumber", formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white font-mono focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Expiration</label>
              <input type="text" value={form.expiry} onChange={e => update("expiry", formatExpiry(e.target.value))} placeholder="MM/YY" className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white font-mono focus:border-[#C9A84C] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">CVC</label>
              <input type="text" value={form.cvc} onChange={e => update("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white font-mono focus:border-[#C9A84C] focus:outline-none" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Set as default payment method</span>
            <button onClick={() => update("isDefault", !form.isDefault)} className={`w-12 h-6 rounded-full transition-colors ${form.isDefault ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${form.isDefault ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          <button onClick={handleSave} disabled={saving || !form.cardholderName || !form.cardNumber || !form.expiry || !form.cvc} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Save Card</>}
          </button>
        </div>
      </div>
    </div>
  );
}