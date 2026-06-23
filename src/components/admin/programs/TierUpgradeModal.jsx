import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

export default function TierUpgradeModal({ enrollment, tiers, onClose, onDone }) {
  const [billing, setBilling] = useState(null);
  const [selectedTierId, setSelectedTierId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(true);

  useEffect(() => {
    if (!enrollment?.linked_tier_id) { setLoadingBilling(false); return; }
    setSelectedTierId(enrollment.linked_tier_id);
    base44.entities.BillingRecord.filter({ user_email: enrollment.user_email || "" }).then(recs => {
      setBilling(recs.find(r => r.status === "active") || recs[0] || null);
    }).catch(() => {}).finally(() => setLoadingBilling(false));
  }, [enrollment]);

  const currentTier = tiers.find(t => t.id === enrollment?.linked_tier_id);
  const targetTier = tiers.find(t => t.id === selectedTierId);
  const currentPrice = enrollment?.locked_in_price || currentTier?.price || 0;
  const targetPrice = targetTier?.price || 0;
  const isUpgrade = targetPrice > currentPrice;
  const isDowngrade = targetPrice < currentPrice;

  // Proration: difference for remaining days in the current billing cycle
  const proratedDiff = (() => {
    if (!targetTier || !billing) return 0;
    const now = new Date();
    let cycleStart, cycleEnd;
    if (billing.next_billing_date) {
      cycleEnd = new Date(billing.next_billing_date);
      cycleStart = new Date(cycleEnd);
      cycleStart.setMonth(cycleStart.getMonth() - 1);
    } else {
      cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
      cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    const totalDays = Math.max(1, Math.round((cycleEnd - cycleStart) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(0, Math.round((now - cycleStart) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const dailyRateOld = currentPrice / totalDays;
    const dailyRateNew = targetPrice / totalDays;
    return (dailyRateNew - dailyRateOld) * remainingDays;
  })();

  const handleApply = async () => {
    if (!targetTier) return;
    setSaving(true);
    try {
      await base44.entities.Enrollment.update(enrollment.id, {
        linked_tier_id: targetTier.id,
        locked_in_price: targetTier.price,
      });
      if (billing && targetTier.billing_interval === "monthly") {
        await base44.entities.BillingRecord.update(billing.id, { recurring_amount: targetTier.price });
      }
      alert(`Tier updated to "${targetTier.tier_name}". ${proratedDiff !== 0 ? `Prorated adjustment: ${proratedDiff > 0 ? "+" : ""}$${proratedDiff.toFixed(2)}` : "No proration needed."}`);
      onDone();
    } catch (e) { alert("Failed to update tier: " + e.message); }
    setSaving(false);
  };

  const programTiers = tiers.filter(t => t.linked_program_id === enrollment?.program_id && t.is_active !== false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Change Subscription Tier</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div className="border border-[#A8A9AD]/20 p-4">
            <p className="text-xs text-[#A8A9AD] mb-1">Student</p>
            <p className="text-sm font-bold">{enrollment?.user_name || enrollment?.user_email}</p>
            <p className="text-xs text-[#A8A9AD] mt-1">Current: {currentTier?.tier_name || "No tier"} — ${currentPrice}/{currentTier?.billing_interval?.replace("_", " ") || "mo"}</p>
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Select New Tier</label>
            {loadingBilling ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div>
            ) : programTiers.length === 0 ? (
              <p className="text-xs text-[#A8A9AD] py-3">No active tiers available for this program. Create tiers in the Tier Builder first.</p>
            ) : (
              <div className="space-y-2">
                {programTiers.map(tier => (
                  <button key={tier.id} onClick={() => setSelectedTierId(tier.id)} className={`w-full text-left p-3 border-2 transition-colors ${selectedTierId === tier.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/20 hover:border-[#A8A9AD]/40"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{tier.tier_name}</p>
                        <p className="text-xs text-[#A8A9AD]">{tier.billing_interval.replace("_", " ")} • {tier.classes_allowed_per_week || "Unlimited"} classes/wk</p>
                      </div>
                      <span className="text-sm font-bold text-[#C9A84C]">${tier.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {targetTier && targetTier.id !== enrollment?.linked_tier_id && (
            <div className="border border-[#A8A9AD]/20 bg-black p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {isUpgrade ? <TrendingUp size={16} className="text-green-400" /> : isDowngrade ? <TrendingDown size={16} className="text-[#C9A84C]" /> : <ArrowRight size={16} className="text-[#A8A9AD]" />}
                <span className="font-medium">{isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Lateral Move"}</span>
              </div>
              <div className="flex justify-between text-xs"><span className="text-[#A8A9AD]">Current rate</span><span>${currentPrice}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#A8A9AD]">New rate</span><span className="text-[#C9A84C]">${targetPrice}</span></div>
              {billing && proratedDiff !== 0 && (
                <div className="flex justify-between text-xs pt-2 border-t border-[#A8A9AD]/10">
                  <span className="text-[#A8A9AD]">Prorated adjustment</span>
                  <span className={proratedDiff > 0 ? "text-green-400 font-bold" : "text-[#C9A84C] font-bold"}>{proratedDiff > 0 ? "+" : ""}${proratedDiff.toFixed(2)}</span>
                </div>
              )}
              <p className="text-xs text-[#A8A9AD] pt-1">The locked-in price will update to ${targetPrice} and the recurring billing amount will be adjusted{proratedDiff !== 0 ? ` with a ${proratedDiff > 0 ? "charge" : "credit"} of $${Math.abs(proratedDiff).toFixed(2)} for the remaining cycle` : ""}.</p>
            </div>
          )}

          <button onClick={handleApply} disabled={saving || !targetTier || targetTier.id === enrollment?.linked_tier_id} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Apply Tier Change"}
          </button>
        </div>
      </div>
    </div>
  );
}