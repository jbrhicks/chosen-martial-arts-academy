import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Settings, Check, Loader2 } from "lucide-react";
import BeltBadge from "@/components/BeltBadge";

export default function IDCard({ user, onClose }) {
  const [showPinSettings, setShowPinSettings] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(user.id)}&color=000000&bgcolor=FFFFFF`;

  const handleSavePin = async () => {
    if (newPin.length < 4 || newPin.length > 6) return;
    setSaving(true);
    try {
      await base44.auth.updateMe({ pin_code: newPin });
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowPinSettings(false); setNewPin(""); }, 1500);
    } catch (e) { alert("Failed to save PIN."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">My ID Card</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>

        <div className="bg-white p-4 mb-4 flex justify-center">
          <img src={qrUrl} alt="Check-in QR Code" className="w-48 h-48" />
        </div>

        <div className="text-center mb-4">
          <p className="font-bold text-lg">{user.full_name}</p>
          {user.belt_rank && <div className="mt-2 flex justify-center"><BeltBadge rank={user.belt_rank} size="sm" /></div>}
        </div>

        {!showPinSettings ? (
          <button onClick={() => setShowPinSettings(true)} className="w-full flex items-center justify-center gap-2 py-3 border border-[#A8A9AD]/30 text-sm text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/30 transition-colors">
            <Settings size={16} /> Set / Reset PIN
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs tracking-widest uppercase text-[#A8A9AD] text-center">Set your 4-6 digit PIN</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white focus:border-[#C9A84C] focus:outline-none"
            />
            <button
              onClick={handleSavePin}
              disabled={saving || newPin.length < 4}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><Check size={16} /> Saved!</> : "Save PIN"}
            </button>
          </div>
        )}

        <p className="text-xs text-[#A8A9AD]/60 text-center mt-4">Scan this code at the front desk kiosk to check in for class.</p>
      </div>
    </div>
  );
}