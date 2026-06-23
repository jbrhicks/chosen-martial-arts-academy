import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, Calendar, Save, Layers } from "lucide-react";

export default function AutomatedRules() {
  const [siblingDiscount, setSiblingDiscount] = useState(null);
  const [payInFullDiscount, setPayInFullDiscount] = useState(null);
  const [multiProgramDiscount, setMultiProgramDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await base44.entities.DiscountsPromos.list();
        setSiblingDiscount(all.find(d => d.automation_type === "sibling") || null);
        setPayInFullDiscount(all.find(d => d.automation_type === "pay_in_full") || null);
        setMultiProgramDiscount(all.find(d => d.automation_type === "multi_program") || null);
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
      if (multiProgramDiscount) {
        const payload = {
          promo_name: multiProgramDiscount.promo_name || "Multi-Program Discount",
          discount_type: multiProgramDiscount.discount_type || "percentage",
          amount: multiProgramDiscount.amount || 0,
          applies_to: multiProgramDiscount.applies_to || "all_additional_programs",
          is_automated: true,
          automation_type: "multi_program",
          is_active: true,
        };
        if (multiProgramDiscount.id) {
          await base44.entities.DiscountsPromos.update(multiProgramDiscount.id, payload);
        } else {
          await base44.entities.DiscountsPromos.create(payload);
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

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Multi-Program (Cross-Training) Discount</h3>
        </div>
        <p className="text-sm text-[#A8A9AD] mb-4">Automatically applies when a single student is enrolled in more than one program simultaneously. The highest-priced program stays full price; the discount applies to the additional program(s).</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Discount Type</label>
              <select
                value={multiProgramDiscount?.discount_type || "percentage"}
                onChange={e => setMultiProgramDiscount({ ...(multiProgramDiscount || {}), discount_type: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              >
                <option value="percentage">Percentage</option>
                <option value="flat_rate">Flat Rate ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Value</label>
              <div className="flex items-center gap-1">
                {multiProgramDiscount?.discount_type === "flat_rate" && <span className="text-[#A8A9AD]">$</span>}
                <input
                  type="number"
                  step="0.01"
                  value={multiProgramDiscount?.amount ?? 50}
                  onChange={e => setMultiProgramDiscount({ ...(multiProgramDiscount || { discount_type: "percentage", applies_to: "all_additional_programs" }), amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2.5 text-sm text-white text-right focus:border-[#C9A84C] focus:outline-none"
                />
                {multiProgramDiscount?.discount_type !== "flat_rate" && <span className="text-[#A8A9AD]">%</span>}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Applies To</label>
            <select
              value={multiProgramDiscount?.applies_to || "all_additional_programs"}
              onChange={e => setMultiProgramDiscount({ ...(multiProgramDiscount || { discount_type: "percentage", amount: 50 }), applies_to: e.target.value })}
              className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
            >
              <option value="second_program">Second program only (lowest-priced)</option>
              <option value="all_additional_programs">All additional programs</option>
              <option value="total_invoice">Total invoice (flat $ per additional program)</option>
            </select>
            <p className="text-xs text-[#A8A9AD] mt-2">
              {multiProgramDiscount?.applies_to === "second_program" && "Discount applies only to the second (lower-priced) program."}
              {multiProgramDiscount?.applies_to === "all_additional_programs" && "Discount applies to every program after the first (highest-priced stays full)."}
              {multiProgramDiscount?.applies_to === "total_invoice" && "Flat dollar amount deducted from the total for each additional program. Use with Flat Rate type."}
            </p>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? "Saved!" : <><Save size={16} /> Save Rules</>}
      </button>
    </div>
  );
}