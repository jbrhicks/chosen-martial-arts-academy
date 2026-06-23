export default function PaymentMethodFields({ billing, update, prefix = "" }) {
  const paymentTypeKey = prefix ? `${prefix}PaymentType` : "paymentType";
  const paymentType = billing[paymentTypeKey] || "credit_card";

  const cardNameKey = prefix ? `${prefix}CardName` : "cardName";
  const cardNumberKey = prefix ? `${prefix}CardNumber` : "cardNumber";
  const cardExpiryKey = prefix ? `${prefix}CardExpiry` : "cardExpiry";
  const cardCvcKey = prefix ? `${prefix}CardCvc` : "cardCvc";
  const achNameKey = prefix ? `${prefix}AchName` : "achName";
  const achAccountKey = prefix ? `${prefix}AchAccount` : "achAccount";
  const achRoutingKey = prefix ? `${prefix}AchRouting` : "achRouting";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => update(paymentTypeKey, "credit_card")} className={`flex-1 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${paymentType === "credit_card" ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>Credit Card</button>
        <button onClick={() => update(paymentTypeKey, "ach")} className={`flex-1 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${paymentType === "ach" ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>ACH / Bank</button>
      </div>
      {paymentType === "credit_card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <input value={billing[cardNameKey] || ""} onChange={(e) => update(cardNameKey, e.target.value)} placeholder="Cardholder Name" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <div className="sm:col-span-3">
            <input value={billing[cardNumberKey] || ""} onChange={(e) => update(cardNumberKey, e.target.value)} placeholder="Card Number" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <input value={billing[cardExpiryKey] || ""} onChange={(e) => update(cardExpiryKey, e.target.value)} placeholder="MM/YY" className="bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          <input value={billing[cardCvcKey] || ""} onChange={(e) => update(cardCvcKey, e.target.value)} placeholder="CVC" className="bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <input value={billing[achNameKey] || ""} onChange={(e) => update(achNameKey, e.target.value)} placeholder="Account Holder Name" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <input value={billing[achAccountKey] || ""} onChange={(e) => update(achAccountKey, e.target.value)} placeholder="Account Number" className="bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          <input value={billing[achRoutingKey] || ""} onChange={(e) => update(achRoutingKey, e.target.value)} placeholder="Routing Number" className="bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
        </div>
      )}
    </div>
  );
}