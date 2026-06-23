import { CreditCard, Loader2 } from "lucide-react";

export default function StepBilling({ billing, setBilling, onSubmit, submitting }) {
  const totalDue = (billing.registrationFee || 0) + (billing.firstMonthTuition || 0) + (billing.equipmentPackage || 0);
  const update = (field, value) => setBilling({ ...billing, [field]: value });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Billing & Checkout</h2>
        <p className="text-sm text-[#A8A9AD]">Set up one-time charges and recurring billing for the family account.</p>
      </div>

      {/* One-time charges */}
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Initial Fees</h3>
        <div className="space-y-3">
          <ChargeRow label="Registration Fee" value={billing.registrationFee} onChange={(v) => update("registrationFee", v)} />
          <ChargeRow label="First Month's Tuition" value={billing.firstMonthTuition} onChange={(v) => update("firstMonthTuition", v)} />
          <ChargeRow label="Equipment Package" value={billing.equipmentPackage} onChange={(v) => update("equipmentPackage", v)} />
        </div>
      </div>

      {/* Recurring billing */}
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Monthly Auto-Pay</h3>
          <button
            onClick={() => update("autoPay", !billing.autoPay)}
            className={`w-12 h-6 rounded-full transition-colors ${billing.autoPay ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}
          >
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
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Billing Cycle</label>
                <select value={billing.billingCycle} onChange={(e) => update("billingCycle", e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  <option value="1st">1st of Month</option>
                  <option value="15th">15th of Month</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => update("paymentType", "credit_card")} className={`flex-1 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${billing.paymentType === "credit_card" ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>Credit Card</button>
              <button onClick={() => update("paymentType", "ach")} className={`flex-1 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${billing.paymentType === "ach" ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>ACH / Bank</button>
            </div>
            {billing.paymentType === "credit_card" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <input value={billing.cardName} onChange={(e) => update("cardName", e.target.value)} placeholder="Cardholder Name" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div className="sm:col-span-3">
                  <input value={billing.cardNumber} onChange={(e) => update("cardNumber", e.target.value)} placeholder="Card Number" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <input value={billing.cardExpiry} onChange={(e) => update("cardExpiry", e.target.value)} placeholder="MM/YY" className="bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                <input value={billing.cardCvc} onChange={(e) => update("cardCvc", e.target.value)} placeholder="CVC" className="bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <input value={billing.achName} onChange={(e) => update("achName", e.target.value)} placeholder="Account Holder Name" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <input value={billing.achAccount} onChange={(e) => update("achAccount", e.target.value)} placeholder="Account Number" className="bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                <input value={billing.achRouting} onChange={(e) => update("achRouting", e.target.value)} placeholder="Routing Number" className="bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
            )}
            <p className="text-xs text-[#A8A9AD]">Payment information is securely stored for recurring billing.</p>
          </div>
        )}
      </div>

      {/* Total & submit */}
      <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Total Due Today</span>
          <span className="text-3xl font-bold text-[#C9A84C]">${totalDue.toFixed(2)}</span>
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