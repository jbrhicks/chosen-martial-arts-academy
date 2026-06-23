import { useState } from "react";
import { Delete, Check, Loader2 } from "lucide-react";

export default function PinPad({ onSubmit, loading }) {
  const [pin, setPin] = useState("");

  const handleDigit = (d) => {
    if (pin.length < 6) setPin(pin + d);
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  const handleSubmit = () => {
    if (pin.length >= 4) {
      onSubmit(pin);
      setPin("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? "bg-[#C9A84C] border-[#C9A84C]" : "border-[#A8A9AD]/30"}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(d => (
          <button key={d} onClick={() => handleDigit(d)} className="aspect-square border border-[#A8A9AD]/30 text-2xl font-bold text-white hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/30 transition-colors">
            {d}
          </button>
        ))}
        <button onClick={handleDelete} className="aspect-square border border-[#A8A9AD]/30 flex items-center justify-center text-[#A8A9AD] hover:bg-white/5 transition-colors">
          <Delete size={24} />
        </button>
        <button onClick={() => handleDigit("0")} className="aspect-square border border-[#A8A9AD]/30 text-2xl font-bold text-white hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/30 transition-colors">
          0
        </button>
        <button onClick={handleSubmit} disabled={pin.length < 4 || loading} className="aspect-square border border-[#C9A84C]/30 bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors disabled:opacity-30">
          {loading ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
        </button>
      </div>
      <p className="text-center text-xs text-[#A8A9AD]">Enter your 4-6 digit PIN</p>
    </div>
  );
}