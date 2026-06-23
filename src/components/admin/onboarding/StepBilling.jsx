import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Loader2, Calculator, Users, Tag, Split, Check, X, Layers } from "lucide-react";
import PaymentMethodFields from "@/components/admin/onboarding/billing/PaymentMethodFields";
import { calculateMultiProgramDiscount } from "@/lib/multiProgramDiscount";

export default function StepBilling({ billing, setBilling, members, onSubmit, submitting }) {
  const [discounts, setDiscounts] = useState([]);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [programs, setPrograms] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [multiDiscount, setMultiDiscount] = useState(null);

  useEffect(() => {
    base44.entities.DiscountsPromos.filter({ is_active: true }).then(data => {
      setDiscounts(data.filter(d => !d.is_automated));
      setMultiDiscount(data.find(d => d.automation_type === "multi_program") || null);
    }).catch(() => {});
    base44.entities.Program.list().then(setPrograms).catch(() => {});
    base44.entities.SubscriptionTier.list().then(setTiers).catch(() => {});
  }, []);

  const update = (field, value) => setBilling({ ...billing, [field]: value });

  const startDate = members[0]?.startDate;
  const monthlyRate = billing.monthlyAmount || 0;

  // Build per-member, per-program line items for the combined invoice preview
  const memberProgramBreakdowns = members.map((member, idx) => {
    const memberPrograms = (member.programs || []).map(pName => {
      const prog = programs.find(p => p.program_name === pName);
      const progTiers = tiers.filter(t => t.linked_program_id === prog?.id && t.is_active !== false).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      const defaultTier = progTiers[0];
      const price = defaultTier?.price || prog?.default_monthly_rate || 0;
      return { programName: pName, price };
    });
    if (memberPrograms.length <= 1) {
      return { memberLabel: member.firstName ? `${member.firstName} ${member.lastName}` : `Member ${idx + 1}`, lineItems: memberPrograms, discount: 0, net: memberPrograms.reduce((s, p) => s + p.price, 0) };
    }
    const { discountAmount, breakdown } = calculateMultiProgramDiscount(memberPrograms, multiDiscount);
    return { memberLabel: member.firstName ? `${member.firstName} ${member.lastName}` : `Member ${idx + 1}`, lineItems: breakdown, discount: discountAmount, net: breakdown.reduce((s, b) => s + b.net, 0) };
  });
  const hasMultiProgram = memberProgramBreakdowns.some(m => m.lineItems.length > 1);
  const combinedMonthlyTotal = memberProgramBreakdowns.reduce((s, m) => s + m.net, 0);

  const proration = (() => {
    if (!startDate || !monthlyRate) return { days: 0, total: 0, daysInMonth: 30, dayOfMonth: 1 };
    const d = new Date(startDate);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const dayOfMonth = d.getDate();
    const remainingDays = daysInMonth - dayOfMonth + 1;
    return { days: remainingDays, total: (monthlyRate / daysInMonth) * remainingDays, daysInMonth, dayOfMonth };
  })();

  const siblingCount = members.length;
  const siblingDiscountPercent = billing.siblingDiscountEnabled ? 10 : 0;
  const siblingDiscountAmount = siblingCount > 1 ? (monthlyRate * siblingDiscountPercent / 100) * (siblingCount - 1) : 0;

  const annualAmount = monthlyRate * 12;
  const payInFullDiscount = billing.payInFull ? annualAmount * 0.10 : 0;
  const tuitionAmount = billing.payInFull
    ? annualAmount - payInFullDiscount
    : (billing.prorateEnabled ? proration.total : (billing.firstMonthTuition || 0));
  const subtotal = (billing.registrationFee || 0) + tuitionAmount + (billing.equipmentPackage || 0);

  const appliedDiscount = discounts.find(d => d.id === billing.appliedDiscountId);
  let discountAmount = 0;
  if (appliedDiscount) {
    const categoryAmount = appliedDiscount.applies_to === "retail" ? (billing.equipmentPackage || 0)
      : appliedDiscount.applies_to === "signup_fee" ? (billing.registrationFee || 0)
      : appliedDiscount.applies_to === "tuition" ? tuitionAmount
      : subtotal;
    discountAmount = appliedDiscount.discount_type === "percentage"
      ? categoryAmount * appliedDiscount.amount / 100
      : Math.min(appliedDiscount.amount, categoryAmount);
  }

  const applyPromo = () => {
    const promo = discounts.find(d => d.promo_code?.toLowerCase() === promoInput.toLowerCase());
    if (!promo) { setPromoError("Invalid promo code."); return; }
    if (!promo.is_active) { setPromoError("This promo code has been disabled."); return; }
    if (promo.start_date && new Date(promo.start_date) > new Date()) { setPromoError("This promo code is not yet active."); return; }
    if (promo.expiration_date && new Date(promo.expiration_date) < new Date()) { setPromoError("This promo code has expired."); return; }
    if (promo.usage_limit && (promo.usage_count || 0) >= promo.usage_limit) { setPromoError("This promo code has reached its usage limit."); return; }
    const hasTuition = tuitionAmount > 0;
    const hasRetail = (billing.equipmentPackage || 0) > 0;
    const hasSignupFee = (billing.registrationFee || 0) > 0;
    if (promo.applies_to === "tuition" && !hasTuition) { setPromoError("This code only applies to tuition."); return; }
    if (promo.applies_to === "retail" && !hasRetail) { setPromoError("This code only applies to retail items."); return; }
    if (promo.applies_to === "signup_fee" && !hasSignupFee) { setPromoError("This code only applies to the sign-up fee."); return; }
    if (promo.applies_to === "event") { setPromoError("This code only applies to event registrations."); return; }
    update("appliedDiscountId", promo.id);
    setPromoError("");
    setPromoInput("");
  };

  const totalDue = Math.max(0, subtotal - discountAmount - siblingDiscountAmount);

  const ratioA = billing.splitBillingEnabled ? (billing.splitRatioA || 50) : 100;
  const ratioB = 100 - ratioA;
  const amountA = totalDue * ratioA / 100;
  const amountB = totalDue * ratioB / 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Billing & Checkout</h2>
        <p className="text-sm text-[#A8A9AD]">Proration, discounts, split billing, and recurring auto-pay scheduling.</p>
      </div>

      {hasMultiProgram && (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-[#C9A84C]" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Combined Invoice Preview (Multi-Program)</h3>
          </div>
          <div className="space-y-4">
            {memberProgramBreakdowns.filter(m => m.lineItems.length > 1).map((m, idx) => (
              <div key={idx} className="border border-[#A8A9AD]/20 p-4">
                <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-3">{m.memberLabel}</p>
                <div className="space-y-2">
                  {m.lineItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white">{item.programName} Tuition</span>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {m.discount > 0 && (
                    <div className="flex items-center justify-between text-sm border-t border-[#A8A9AD]/20 pt-2">
                      <span className="text-green-400">Multi-Program Discount</span>
                      <span className="text-green-400">−${m.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-bold border-t border-[#A8A9AD]/20 pt-2">
                    <span>Subtotal</span>
                    <span className="text-[#C9A84C]">${m.net.toFixed(2)}/mo</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-[#A8A9AD]/20 pt-3">
              <span className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Total Monthly Auto-Pay</span>
              <span className="text-2xl font-bold text-[#C9A84C]">${combinedMonthlyTotal.toFixed(2)}</span>
            </div>
            <button onClick={() => update("monthlyAmount", parseFloat(combinedMonthlyTotal.toFixed(2)))} className="text-xs text-[#C9A84C] tracking-widest uppercase hover:text-[#E0C97A]">↻ Set monthly tuition to combined total</button>
          </div>
        </div>
      )}

      {startDate && (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-[#C9A84C]" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Smart Proration Calculator</h3>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm">Start Date: <span className="font-bold">{new Date(startDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span></p>
              <p className="text-xs text-[#A8A9AD] mt-1">{proration.days} of {proration.daysInMonth} days remaining this month</p>
            </div>
            <button onClick={() => update("prorateEnabled", !billing.prorateEnabled)} className={`px-4 py-2 text-xs font-bold tracking-widest uppercase border ${billing.prorateEnabled ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/30 text-[#A8A9AD]"}`}>
              {billing.prorateEnabled ? "Proration ON" : "Proration OFF"}
            </button>
          </div>
          {billing.prorateEnabled && (
            <div className="flex items-center justify-between border-t border-[#A8A9AD]/20 pt-4">
              <span className="text-sm">Prorated First Month Tuition</span>
              <span className="text-2xl font-bold text-[#C9A84C]">${proration.total.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Initial Fees</h3>
        <div className="space-y-3">
          <ChargeRow label="Registration Fee" value={billing.registrationFee} onChange={(v) => update("registrationFee", v)} />
          <ChargeRow label={billing.prorateEnabled ? "Full Month Tuition (reference)" : "First Month's Tuition"} value={billing.firstMonthTuition} onChange={(v) => update("firstMonthTuition", v)} />
          <ChargeRow label="Equipment Package" value={billing.equipmentPackage} onChange={(v) => update("equipmentPackage", v)} />
        </div>
      </div>

      {siblingCount > 1 && (
        <div className="border border-[#A8A9AD]/20 bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-[#C9A84C]" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Automated Sibling Discount</h3>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm">{siblingCount} students enrolled in this family</p>
              <p className="text-xs text-[#A8A9AD] mt-1">10% discount auto-applied to {siblingCount - 1} additional student(s)</p>
            </div>
            <button onClick={() => update("siblingDiscountEnabled", !billing.siblingDiscountEnabled)} className={`w-12 h-6 rounded-full transition-colors ${billing.siblingDiscountEnabled ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${billing.siblingDiscountEnabled ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          {billing.siblingDiscountEnabled && (
            <div className="flex items-center justify-between border-t border-[#A8A9AD]/20 pt-4">
              <span className="text-sm">Sibling Discount (10% × {siblingCount - 1})</span>
              <span className="text-lg font-bold text-green-400">−${siblingDiscountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Discounts & Promos</h3>
        </div>
        <div className="flex gap-2 mb-4">
          <input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Enter promo code..." className="flex-1 bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          <button onClick={applyPromo} className="px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#E0C97A] transition-colors">Apply</button>
        </div>
        {promoError && <p className="text-xs text-red-400 mb-3">{promoError}</p>}
        {appliedDiscount && (
          <div className="flex items-center justify-between border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-4 py-3 mb-3">
            <div>
              <p className="text-sm font-medium">{appliedDiscount.promo_name}</p>
              <p className="text-xs text-[#A8A9AD]">{appliedDiscount.discount_type === "percentage" ? `${appliedDiscount.amount}% off` : `$${appliedDiscount.amount} off`} • {appliedDiscount.applies_to}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-green-400">−${discountAmount.toFixed(2)}</span>
              <button onClick={() => update("appliedDiscountId", "")} className="text-[#A8A9AD] hover:text-red-400"><X size={16} /></button>
            </div>
          </div>
        )}
        {discounts.length > 0 && !appliedDiscount && (
          <div className="space-y-2">
            <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Available Discounts</p>
            {discounts.map(d => (
              <button key={d.id} onClick={() => update("appliedDiscountId", d.id)} className="w-full flex items-center justify-between border border-[#A8A9AD]/20 px-4 py-3 hover:border-[#C9A84C]/30 transition-colors text-left">
                <div>
                  <p className="text-sm font-medium">{d.promo_name}</p>
                  <p className="text-xs text-[#A8A9AD]">{d.discount_type === "percentage" ? `${d.amount}% off` : `$${d.amount} off`} • {d.applies_to}</p>
                </div>
                <Check size={16} className="text-[#A8A9AD]" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Monthly Auto-Pay</h3>
          <button onClick={() => update("autoPay", !billing.autoPay)} className={`w-12 h-6 rounded-full transition-colors ${billing.autoPay ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${billing.autoPay ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
        {billing.autoPay && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Monthly Tuition ($)</label>
                <input type="number" value={billing.monthlyAmount} onChange={(e) => update("monthlyAmount", parseFloat(e.target.value) || 0)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Auto-Pay Day</label>
                <select value={billing.billingCycleDate} onChange={(e) => update("billingCycleDate", parseInt(e.target.value))} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of Month</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between border border-[#A8A9AD]/20 p-4">
              <div>
                <p className="text-sm font-medium">Pay Annually (Save 10%)</p>
                <p className="text-xs text-[#A8A9AD]">Pay 12 months upfront instead of monthly — saves ${payInFullDiscount.toFixed(2)}</p>
              </div>
              <button onClick={() => update("payInFull", !billing.payInFull)} className={`w-12 h-6 rounded-full transition-colors ${billing.payInFull ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${billing.payInFull ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
            <PaymentMethodFields billing={billing} update={update} prefix="" />
            <div className="border-t border-[#A8A9AD]/20 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Split size={16} className="text-[#C9A84C]" />
                  <span className="text-sm font-medium">Split Billing (Two Guardians)</span>
                </div>
                <button onClick={() => update("splitBillingEnabled", !billing.splitBillingEnabled)} className={`w-12 h-6 rounded-full transition-colors ${billing.splitBillingEnabled ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${billing.splitBillingEnabled ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
              {billing.splitBillingEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Split Ratio: Guardian A {billing.splitRatioA || 50}% / Guardian B {100 - (billing.splitRatioA || 50)}%</label>
                    <input type="range" min="0" max="100" step="5" value={billing.splitRatioA || 50} onChange={(e) => update("splitRatioA", parseInt(e.target.value))} className="w-full accent-[#C9A84C]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-[#A8A9AD]/20 p-4">
                      <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Guardian A ({billing.splitRatioA || 50}%)</p>
                      <p className="text-lg font-bold mb-3">${amountA.toFixed(2)}/mo</p>
                      <PaymentMethodFields billing={billing} update={update} prefix="second" />
                    </div>
                    <div className="border border-[#A8A9AD]/20 p-4">
                      <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Guardian B ({100 - (billing.splitRatioA || 50)}%)</p>
                      <p className="text-lg font-bold mb-3">${amountB.toFixed(2)}/mo</p>
                      <p className="text-xs text-[#A8A9AD]">Billed to Guardian A's method on file. System will process two separate transactions on the billing date.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6">
        <div className="space-y-2 mb-4">
          <LineItem label="Registration Fee" amount={billing.registrationFee || 0} />
          <LineItem label={billing.payInFull ? "Annual Tuition (10% off)" : billing.prorateEnabled ? "Prorated Tuition" : "First Month Tuition"} amount={tuitionAmount} />
          {(billing.equipmentPackage || 0) > 0 && <LineItem label="Equipment" amount={billing.equipmentPackage || 0} />}
          {discountAmount > 0 && <LineItem label="Discount" amount={-discountAmount} className="text-green-400" />}
          {siblingDiscountAmount > 0 && <LineItem label="Sibling Discount" amount={-siblingDiscountAmount} className="text-green-400" />}
          <div className="flex items-center justify-between border-t border-[#A8A9AD]/20 pt-2">
            <span className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Total Due Today</span>
            <span className="text-3xl font-bold text-[#C9A84C]">${totalDue.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={onSubmit} disabled={submitting} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <><CreditCard size={18} /> Process Payment & Create Account</>}
        </button>
      </div>
    </div>
  );
}

function ChargeRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm flex-1">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-[#A8A9AD]">$</span>
        <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-24 bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white text-right focus:border-[#C9A84C] focus:outline-none" />
      </div>
    </div>
  );
}

function LineItem({ label, amount, className = "" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#A8A9AD]">{label}</span>
      <span className={className}>${Math.abs(amount).toFixed(2)}</span>
    </div>
  );
}