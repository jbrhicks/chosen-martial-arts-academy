import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Check, RefreshCw } from "lucide-react";

export default function PromoCreator({ editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    promo_name: "", promo_code: "", discount_type: "percentage", amount: 0,
    applies_to: "all", start_date: "", expiration_date: "", usage_limit: "", is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        promo_name: editing.promo_name || "",
        promo_code: editing.promo_code || "",
        discount_type: editing.discount_type || "percentage",
        amount: editing.amount || 0,
        applies_to: editing.applies_to || "all",
        start_date: editing.start_date || "",
        expiration_date: editing.expiration_date || "",
        usage_limit: editing.usage_limit || "",
        is_active: editing.is_active !== false,
      });
    }
  }, [editing]);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    update("promo_code", code);
  };

  const handleSave = async () => {
    if (!form.promo_name || !form.amount) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        is_automated: false,
        automation_type: "manual",
      };
      if (editing) {
        await base44.entities.DiscountsPromos.update(editing.id, payload);
      } else {
        await base44.entities.DiscountsPromos.create(payload);
      }
      onSaved();
    } catch (e) { alert("Failed to save promo code."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg border border-[#C9A84C]/30 bg-[#0A0A0A] p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{editing ? "Edit Promo Code" : "Create Promo Code"}</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Promo Name *</label>
            <input type="text" value={form.promo_name} onChange={e => update("promo_name", e.target.value)} placeholder="e.g., Buddy Week 2026" className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Promo Code *</label>
            <div className="flex gap-2">
              <input type="text" value={form.promo_code} onChange={e => update("promo_code", e.target.value.toUpperCase())} placeholder="BUDDYWEEK2026" className="flex-1 bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white font-mono focus:border-[#C9A84C] focus:outline-none" />
              <button onClick={generateCode} className="px-4 border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors" title="Generate random code">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Discount Type *</label>
              <select value={form.discount_type} onChange={e => update("discount_type", e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                <option value="percentage">Percentage (%)</option>
                <option value="flat_rate">Flat Rate ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Value *</label>
              <input type="number" value={form.amount} onChange={e => update("amount", parseFloat(e.target.value) || 0)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Applies To</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { value: "all", label: "All Items" },
                { value: "tuition", label: "Tuition Only" },
                { value: "retail", label: "Retail Only" },
                { value: "signup_fee", label: "Sign-up Fee" },
                { value: "event", label: "Events Only" },
              ].map(opt => (
                <button key={opt.value} onClick={() => update("applies_to", opt.value)} className={`px-3 py-2 text-xs font-medium border-2 transition-colors ${form.applies_to === opt.value ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => update("start_date", e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Expiration Date</label>
              <input type="date" value={form.expiration_date} onChange={e => update("expiration_date", e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Usage Limit (leave empty for unlimited)</label>
            <input type="number" value={form.usage_limit} onChange={e => update("usage_limit", e.target.value)} placeholder="e.g., 20 (first 20 people)" className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Active (accept redemptions)</span>
            <button onClick={() => update("is_active", !form.is_active)} className={`w-12 h-6 rounded-full transition-colors ${form.is_active ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${form.is_active ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          <button onClick={handleSave} disabled={saving || !form.promo_name || !form.amount} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> {editing ? "Update Promo" : "Create Promo"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}