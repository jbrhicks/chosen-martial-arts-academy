import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, Calendar, Save } from "lucide-react";

export default function AutomatedRules() {
  const [siblingDiscount, setSiblingDiscount] = useState(null);
  const [payInFullDiscount, setPayInFullDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await base44.entities.DiscountsPromos.list();
        setSiblingDiscount(all.find(d => d.automation_type === "sibling") || null);
        setPayInFullDiscount(all.find(d => d.automation_type === "pay_in_full") || null);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (siblingDiscount) {
        if (siblingDiscount.id) {
          await base44.entities.DiscountsPromos.update(siblingDiscount.id, { amount: siblingDiscount.amount });
        } else {
          await base44.entities.DiscountsPromos.create({ ...siblingDiscount, is_automated: true, automation_type: "sibling", is_active: true });
        }
      }
      if (payInFullDiscount) {
        if (payInFullDiscount.id) {
          await base44.entities.DiscountsPromos.update(payInFullDiscount.id, { amount: payInFullDiscount.amount });
        } else {
          await base44.entities.DiscountsPromos.create({ ...payInFullDiscount, is_automated: true, automation_type: "pay_in_full", is_active: true });
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert("Failed to save automated rules."); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Automated Rule-Based Discounts</h2>
        <p className="text-sm text-[#A8A9AD]">These discounts apply automatically without a promo code when conditions are met.</p>
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Sibling / Family Discount</h3>
        </div>
        <p className="text-sm text-[#A8A9AD] mb-4">Automatically applies a percentage off the second and third child's tuition when multiple active students share the same FamilyGroup.</p>
        <div className="flex items-center gap-4">
          <label className="text-sm">Discount Percentage:</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={siblingDiscount?.amount ?? 10}
              onChange={e => setSiblingDiscount({ ...(siblingDiscount || { promo_name: "Sibling/Family Discount", discount_type: "percentage", applies_to: "tuition" }), amount: parseFloat(e.target.value) || 0 })}
              className="w-20 bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white text-right focus:border-[#C9A84C] focus:outline-none"
            />
            <span className="text-[#A8A9AD]">%</span>
          </div>
        </div>
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Pay-In-Full (Annual) Discount</h3>
        </div>
        <p className="text-sm text-[#A8A9AD] mb-4">Automatically applies a percentage discount when a customer selects "Pay Annually" instead of monthly billing.</p>
        <div className="flex items-center gap-4">
          <label className="text-sm">Discount Percentage:</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={payInFullDiscount?.amount ?? 10}
              onChange={e => setPayInFullDiscount({ ...(payInFullDiscount || { promo_name: "Pay-In-Full Annual Discount", discount_type: "percentage", applies_to: "tuition" }), amount: parseFloat(e.target.value) || 0 })}
              className="w-20 bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white text-right focus:border-[#C9A84C] focus:outline-none"
            />
            <span className="text-[#A8A9AD]">%</span>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? "Saved!" : <><Save size={16} /> Save Rules</>}
      </button>
    </div>
  );
}