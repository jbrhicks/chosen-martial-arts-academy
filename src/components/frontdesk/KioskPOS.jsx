import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import QRScanner from "@/components/kiosk/QRScanner";
import { ChevronLeft, Search, QrCode, Phone, KeyRound, ShoppingCart, Trash2, Loader2, CheckCircle, CreditCard, Mail } from "lucide-react";

export default function KioskPOS({ onBack }) {
  const [stage, setStage] = useState("lookup");
  const [member, setMember] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [lookupMode, setLookupMode] = useState("qr");
  const [search, setSearch] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    base44.entities.Inventory.filter({ is_active: true }).then(setInventory).catch(() => {});
  }, []);

  const handleQRScan = (data) => {
    base44.entities.User.list().then(users => {
      const u = users.find(x => x.id === data);
      if (u) { setMember(u); loadPaymentMethods(u); setStage("storefront"); }
    }).catch(() => {});
  };

  const handlePhoneSearch = () => {
    base44.entities.User.list().then(users => {
      const u = users.find(x => x.phone === search || x.phone?.replace(/\D/g, "") === search.replace(/\D/g, ""));
      if (u) { setMember(u); loadPaymentMethods(u); setStage("storefront"); }
      else alert("No member found with that phone number.");
    }).catch(() => {});
  };

  const handlePinLookup = () => {
    base44.entities.User.list().then(users => {
      const u = users.find(x => x.pin_code === pinInput);
      if (u) { setMember(u); loadPaymentMethods(u); setStage("storefront"); }
      else alert("No member found with that PIN.");
    }).catch(() => {});
  };

  const loadPaymentMethods = (u) => {
    if (u.family_id) {
      base44.entities.PaymentMethod.filter({ family_id: u.family_id }).then(setPaymentMethods).catch(() => {});
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: item.id, item_name: item.item_name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const res = await base44.functions.invoke("processKioskSale", {
        items: cart,
        user_id: member?.id,
        user_name: member?.full_name,
        user_email: member?.email,
        payment_method: selectedCard ? `Card on file (${selectedCard.last4})` : "New card",
      });
      const data = res.data || res;
      if (data.success) {
        setReceipt({ total: data.total, items: data.items, paymentMethod: selectedCard ? `Card ending ${selectedCard.last4}` : "New card" });
        setStage("receipt");
      } else {
        alert(data.error || "Payment failed");
      }
    } catch (e) {
      alert("Payment failed: " + e.message);
    }
    setProcessing(false);
  };

  const reset = () => {
    setStage("lookup");
    setMember(null);
    setCart([]);
    setSearch("");
    setPinInput("");
    setSelectedCard(null);
    setReceipt(null);
  };

  // === LOOKUP STAGE ===
  if (stage === "lookup") {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] text-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#A8A9AD]/10">
          <button onClick={onBack} className="flex items-center gap-2 text-[#A8A9AD] hover:text-white"><ChevronLeft size={20} /> Home</button>
          <span className="text-sm font-bold tracking-widest uppercase">Member Shop</span>
          <div className="w-20" />
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <div className="flex gap-1 border border-[#A8A9AD]/20 p-1 mb-8">
              {[{ key: "qr", label: "Scan QR", icon: QrCode }, { key: "phone", label: "Phone", icon: Phone }, { key: "pin", label: "PIN", icon: KeyRound }].map(t => {
                const Icon = t.icon;
                return <button key={t.key} onClick={() => setLookupMode(t.key)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${lookupMode === t.key ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}><Icon size={16} /> {t.label}</button>;
              })}
            </div>
            {lookupMode === "qr" && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Scan Your QR Code</h2>
                <p className="text-[#A8A9AD] mb-6">Open the app and show your ID card</p>
                <QRScanner onScan={handleQRScan} />
              </div>
            )}
            {lookupMode === "phone" && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Enter Your Phone</h2>
                <p className="text-[#A8A9AD] mb-6">Type the phone number on your account</p>
                <div className="relative mb-4">
                  <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
                  <input type="tel" value={search} onChange={e => setSearch(e.target.value)} placeholder="(555) 123-4567" className="w-full bg-transparent border-2 border-[#A8A9AD]/30 pl-12 pr-4 py-4 text-xl focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <button onClick={handlePhoneSearch} className="w-full py-4 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A]">Find My Account</button>
              </div>
            )}
            {lookupMode === "pin" && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Enter Your PIN</h2>
                <p className="text-[#A8A9AD] mb-6">Type your 4-digit check-in PIN</p>
                <div className="relative mb-4">
                  <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
                  <input type="password" inputMode="numeric" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="w-full bg-transparent border-2 border-[#A8A9AD]/30 pl-12 pr-4 py-4 text-2xl text-center tracking-[0.5em] focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <button onClick={handlePinLookup} className="w-full py-4 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A]">Find My Account</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === RECEIPT STAGE ===
  if (stage === "receipt") {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] text-white flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-[#C9A84C]" /></div>
          <h1 className="text-2xl font-bold mb-2">Payment Complete!</h1>
          <p className="text-[#A8A9AD] mb-6">A receipt has been emailed to {member?.email}.</p>
          <div className="border border-[#A8A9AD]/20 p-4 mb-6 text-left">
            {receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1"><span className="text-[#A8A9AD]">{item.name} x{item.quantity}</span><span>${item.lineTotal.toFixed(2)}</span></div>
            ))}
            <div className="border-t border-[#A8A9AD]/20 mt-3 pt-3 flex justify-between font-bold text-lg"><span>Total</span><span className="text-[#C9A84C]">${receipt.total.toFixed(2)}</span></div>
            <p className="text-xs text-[#A8A9AD] mt-2">Paid via {receipt.paymentMethod}</p>
          </div>
          <button onClick={reset} className="w-full py-4 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A]">Done — Next Customer</button>
        </div>
      </div>
    );
  }

  // === STOREFRONT + CHECKOUT ===
  return (
    <div className="fixed inset-0 bg-[#0A0A0A] text-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[#A8A9AD]/10">
        <button onClick={reset} className="flex items-center gap-2 text-[#A8A9AD] hover:text-white"><ChevronLeft size={20} /> New Customer</button>
        <div className="text-center"><p className="text-sm font-bold">{member?.full_name}</p><p className="text-xs text-[#A8A9AD]">{member?.email}</p></div>
        <div className="flex items-center gap-2 text-[#C9A84C]"><ShoppingCart size={20} /><span className="font-bold">{cart.length}</span></div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Storefront */}
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-lg font-bold mb-4">Shop</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {inventory.map(item => (
              <button key={item.id} onClick={() => addToCart(item)} disabled={item.stock_quantity <= 0} className="text-left border border-[#A8A9AD]/20 p-4 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-colors disabled:opacity-30">
                <div className="w-full h-20 bg-[#1a1a1a] flex items-center justify-center mb-3 text-3xl">{item.category === "Testing Fee" ? "🥋" : item.category === "Event Ticket" ? "🎟️" : "📦"}</div>
                <p className="font-bold text-sm mb-1">{item.item_name}</p>
                <p className="text-xs text-[#A8A9AD] mb-2">{item.category}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#C9A84C] font-bold">${item.price}</span>
                  <span className={`text-xs ${item.stock_quantity <= item.low_stock_threshold ? "text-red-400" : "text-[#A8A9AD]"}`}>{item.stock_quantity <= 0 ? "Out of stock" : `${item.stock_quantity} left`}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart sidebar */}
        <div className="w-80 md:w-96 border-l border-[#A8A9AD]/10 flex flex-col bg-[#0F0F0F]">
          <div className="p-4 border-b border-[#A8A9AD]/10"><h2 className="text-lg font-bold">Cart</h2></div>
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="text-center text-[#A8A9AD] py-12">Add items to your cart</p>
            ) : (
              <div className="space-y-3">
                {cart.map(c => (
                  <div key={c.id} className="flex items-center gap-3 border border-[#A8A9AD]/10 p-3">
                    <div className="flex-1"><p className="text-sm font-medium">{c.item_name}</p><p className="text-xs text-[#C9A84C]">${c.price} each</p></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(c.id, -1)} className="w-7 h-7 border border-[#A8A9AD]/30 text-sm hover:bg-white/5">−</button>
                      <span className="w-6 text-center text-sm">{c.quantity}</span>
                      <button onClick={() => updateQty(c.id, 1)} className="w-7 h-7 border border-[#A8A9AD]/30 text-sm hover:bg-white/5">+</button>
                      <button onClick={() => removeFromCart(c.id)} className="ml-1 text-[#A8A9AD] hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-4 border-t border-[#A8A9AD]/10">
              <div className="flex justify-between mb-4"><span className="text-[#A8A9AD]">Total</span><span className="text-2xl font-bold text-[#C9A84C]">${cartTotal.toFixed(2)}</span></div>
              {/* Payment method selection */}
              <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Payment Method</p>
              <div className="space-y-2 mb-4">
                {paymentMethods.length > 0 && paymentMethods.map(pm => (
                  <button key={pm.id} onClick={() => setSelectedCard(selectedCard?.id === pm.id ? null : pm)} className={`w-full flex items-center gap-3 p-3 border-2 transition-colors ${selectedCard?.id === pm.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/20"}`}>
                    <CreditCard size={18} className="text-[#A8A9AD]" />
                    <div className="text-left"><p className="text-sm font-medium">{pm.card_brand} •••• {pm.last4}</p><p className="text-xs text-[#A8A9AD]">{pm.cardholder_name}</p></div>
                  </button>
                ))}
                <button onClick={() => setSelectedCard(null)} className={`w-full flex items-center gap-3 p-3 border-2 transition-colors ${!selectedCard ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/20"}`}>
                  <CreditCard size={18} className="text-[#A8A9AD]" />
                  <span className="text-sm font-medium">Pay with New Card</span>
                </button>
              </div>
              <button onClick={handleCheckout} disabled={processing} className="w-full py-4 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : `Charge $${cartTotal.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}